"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import type { FormState } from "@/actions/auth";
import { requireFullAdmin, requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { processStripeEvent } from "@/lib/stripe-events";
import { sendRecoveryEmail, sendTransferInstructions } from "@/lib/orders-ops";
import { processWaitlist } from "@/lib/waitlist";
import { sendMail } from "@/lib/email";
import { parseFaqs } from "@/lib/site-content";
import { courseDays, isEnded } from "@/lib/format";
import { getCurrentProfile } from "@/lib/data";
import { nowMs } from "@/lib/time";
import type Stripe from "stripe";

const fe = (e: z.ZodError) => ({ errors: z.flattenError(e).fieldErrors as Record<string, string[]> });

/* Bank transfer orders */

export async function createTransferOrder(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireStaff();
  const parsed = z
    .object({ course_id: z.uuid({ error: "Alege cursul." }), amount: z.coerce.number().min(0, { error: "Suma nu poate fi negativă." }).max(100000), note: z.string().trim().min(3, { error: "Introdu o notă." }).max(300) })
    .safeParse({ course_id: formData.get("course_id"), amount: formData.get("amount"), note: formData.get("note") });
  if (!parsed.success) return fe(parsed.error);
  const { data: bp } = await admin.from("billing_profiles").select("kind, name, cui, reg_com, address, city, county").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await admin.rpc("admin_transfer_order", {
    p_user: userId,
    p_course: parsed.data.course_id,
    p_amount_cents: Math.round(parsed.data.amount * 100),
    p_note: parsed.data.note,
    p_by: profile.id,
    p_billing: bp ?? null,
  });
  if (error) return { message: error.message.includes("already_enrolled") ? "Utilizatorul este deja înscris la acest curs." : "Comanda nu a putut fi creată." };
  await logAudit(profile.id, "transfer_order", String(data), { user: userId, amount: parsed.data.amount });
  const sent = await sendTransferInstructions(String(data));
  revalidatePath(`/admin/useri/${userId}`);
  revalidatePath("/admin/comenzi");
  return { message: `Comanda este în așteptarea plății. ${sent.ok ? "Instrucțiunile de plată au fost trimise clientului." : sent.message}${bp ? "" : " Userul nu are profil de facturare, factura nu se poate emite automat."}` };
}

export async function resendTransferInstructions(orderId: string): Promise<void> {
  await requireStaff();
  await sendTransferInstructions(orderId);
  revalidatePath(`/admin/comenzi/${orderId}`);
}

/* Abandoned checkouts */

export async function sendRecoveryNow(orderId: string): Promise<void> {
  const { profile } = await requireStaff();
  await sendRecoveryEmail(orderId);
  await logAudit(profile.id, "recovery_email", orderId);
  revalidatePath("/admin/abandonate");
}

/* Stripe events */

export async function reprocessStripeEvent(eventId: string): Promise<void> {
  const { admin, profile } = await requireFullAdmin();
  const { data } = await admin.from("stripe_events").select("payload, attempts").eq("id", eventId).maybeSingle();
  if (!data?.payload) return;
  let result: Awaited<ReturnType<typeof processStripeEvent>>;
  try {
    result = await processStripeEvent(data.payload as unknown as Stripe.Event);
  } catch (e) {
    result = { status: "failed", error: e instanceof Error ? e.message : "eroare necunoscută" };
  }
  await admin.from("stripe_events").update({ status: result.status, error: result.error ?? null, attempts: data.attempts + 1, processed_at: new Date().toISOString() }).eq("id", eventId);
  await logAudit(profile.id, "reprocess_stripe_event", eventId, { result: result.status });
  revalidatePath("/admin/sistem");
}

/* Waitlist */

export async function offerSeat(waitlistId: string, courseId: string): Promise<void> {
  const { admin, profile } = await requireFullAdmin();
  const { data: w } = await admin.from("waitlist").select("id, email, name").eq("id", waitlistId).maybeSingle();
  const { data: course } = await admin.from("courses").select("title, slug").eq("id", courseId).maybeSingle();
  if (!w || !course) return;
  const expires = new Date(Date.now() + 48 * 3_600_000);
  const ok = await sendMail({
    to: w.email,
    subject: `Loc disponibil: ${course.title}`,
    heading: "Un loc este disponibil",
    paragraphs: [`${w.name ? `Bună, ${w.name}.` : "Bună."} Ți-am rezervat prioritar un loc la ${course.title}, pentru că ești pe lista de așteptare.`, "Ai 48 de ore să te înscrii, după care oferim locul următoarei persoane."],
    cta: { label: "Rezervă locul", href: `/cursuri/${course.slug}` },
    kind: "waitlist",
  });
  if (ok) await admin.from("waitlist").update({ notified_at: new Date().toISOString(), offer_expires_at: expires.toISOString() }).eq("id", waitlistId);
  await logAudit(profile.id, "waitlist_offer", waitlistId, { course: course.title });
  revalidatePath("/admin/asteptare");
}

export async function removeWaitlistEntry(waitlistId: string): Promise<void> {
  const { admin, profile } = await requireFullAdmin();
  await admin.from("waitlist").delete().eq("id", waitlistId);
  await logAudit(profile.id, "waitlist_remove", waitlistId);
  revalidatePath("/admin/asteptare");
}

export async function runWaitlist(courseId: string): Promise<void> {
  const { profile } = await requireFullAdmin();
  const n = await processWaitlist(courseId);
  await logAudit(profile.id, "waitlist_process", courseId, { offers: n });
  revalidatePath("/admin/asteptare");
}

/* Attendance per day and certificates */

export async function setDayAttendance(enrollmentId: string, courseId: string, day: string, present: boolean): Promise<void> {
  const { admin, profile } = await requireStaff();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const { data: course } = await admin.from("courses").select("starts_at, ends_at").eq("id", courseId).maybeSingle();
  if (!course || !courseDays(course.starts_at, course.ends_at).includes(day)) return;
  await admin.from("attendance").upsert({ enrollment_id: enrollmentId, day, present, marked_by: profile.id, marked_at: new Date().toISOString() });
  const { count } = await admin.from("attendance").select("day", { count: "exact", head: true }).eq("enrollment_id", enrollmentId).eq("present", true);
  const attended = (count ?? 0) > 0;
  await admin.from("enrollments").update({ attended }).eq("id", enrollmentId);
  if (attended) await admin.rpc("issue_certificate", { p_enrollment: enrollmentId });
  revalidatePath(`/admin/prezenta/${courseId}`);
  revalidatePath(`/admin/cursuri/${courseId}/participanti`);
}

/* Feedback after a course */

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, { error: "Alege o notă." }).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function submitFeedback(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Autentifică-te pentru a trimite feedback." };
  const parsed = feedbackSchema.safeParse({ rating: formData.get("rating"), comment: (formData.get("comment") as string) || undefined });
  if (!parsed.success) return fe(parsed.error);

  const admin = createAdminClient();
  const { data: enr } = await admin.from("enrollments").select("id, courses(title, starts_at, ends_at)").eq("user_id", profile.id).eq("course_id", courseId).maybeSingle();
  const course = (enr as unknown as { courses: { title: string; starts_at: string | null; ends_at: string | null } | null } | null)?.courses;
  if (!enr || !course) return { message: "Poți evalua doar cursurile la care ești înscris." };
  if (!isEnded(course, nowMs())) return { message: "Evaluarea se poate trimite după încheierea cursului." };

  const publish = formData.get("allow_public") === "on" && (parsed.data.comment?.length ?? 0) >= 20;
  const { error } = await admin.from("course_feedback").insert({
    enrollment_id: enr.id,
    user_id: profile.id,
    course_id: courseId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    allow_public: publish,
  });
  if (error) return { message: error.code === "23505" ? "Ai trimis deja feedback pentru acest curs." : "Feedbackul nu a putut fi trimis." };

  if (publish) {
    const { count } = await admin.from("testimonials").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("course_id", courseId);
    if ((count ?? 0) === 0) {
      await admin.from("testimonials").insert({
        author_name: profile.full_name ?? "Cursant",
        author_title: [profile.specialization, course.title].filter(Boolean).join(", "),
        quote: parsed.data.comment!,
        is_published: false,
        verified: true,
        user_id: profile.id,
        course_id: courseId,
        sort_order: 100,
      });
    }
  }
  return { message: publish ? "Mulțumim! Comentariul tău va apărea pe site după aprobarea echipei." : "Mulțumim pentru feedback!" };
}

/* Testimonial moderation */

export async function approveTestimonial(id: string): Promise<void> {
  const { admin, profile } = await requireFullAdmin();
  await admin.from("testimonials").update({ is_published: true, sort_order: 0 }).eq("id", id);
  await logAudit(profile.id, "approve_testimonial", id);
  revalidatePath("/admin/testimoniale");
  revalidatePath("/testimoniale");
}

export async function rejectTestimonial(id: string): Promise<void> {
  const { admin, profile } = await requireFullAdmin();
  await admin.from("testimonials").delete().eq("id", id);
  await logAudit(profile.id, "reject_testimonial", id);
  revalidatePath("/admin/testimoniale");
}

/* Site content editor */

async function saveContent(key: string, value: unknown, actor: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("site_content").upsert({ key, value: value as never, updated_at: new Date().toISOString(), updated_by: actor });
  return !error;
}

export async function saveFaqs(_: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFullAdmin();
  const text = String(formData.get("faqs") ?? "");
  const faqs = parseFaqs(text);
  if (text.trim() && faqs.length === 0) return { message: "Format invalid. Întrebarea pe primul rând, răspunsul pe următoarele, blocuri separate printr-un rând gol." };
  if (!(await saveContent("faqs", faqs, profile.id))) return { message: "Nu s-a putut salva." };
  revalidatePath("/", "layout");
  return { message: faqs.length ? `Salvat: ${faqs.length} întrebări.` : "Lista goală: site-ul folosește întrebările implicite." };
}

export async function savePartners(_: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFullAdmin();
  const list = String(formData.get("partners") ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30);
  if (!(await saveContent("partners", list, profile.id))) return { message: "Nu s-a putut salva." };
  revalidatePath("/", "layout");
  return { message: list.length ? `Salvat: ${list.length} parteneri. Afișează doar mărci cu acord scris.` : "Lista este goală: secțiunea este ascunsă." };
}

export async function saveBank(_: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFullAdmin();
  const text = String(formData.get("bank") ?? "").trim().slice(0, 1000);
  if (!(await saveContent("private:bank", text, profile.id))) return { message: "Nu s-a putut salva." };
  return { message: "Datele bancare au fost salvate. Nu sunt publice, apar doar în emailurile de transfer." };
}

export async function saveLegal(key: "legal_termeni" | "legal_confidentialitate" | "legal_cookies" | "legal_rambursare", _: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFullAdmin();
  const text = String(formData.get("text") ?? "").trim().slice(0, 60000);
  if (!(await saveContent(key, text, profile.id))) return { message: "Nu s-a putut salva." };
  revalidatePath("/termeni");
  revalidatePath("/confidentialitate");
  revalidatePath("/cookies");
  revalidatePath("/rambursare");
  return { message: text ? "Textul a fost salvat și este public." : "Textul a fost golit: pagina revine la varianta implicită." };
}
