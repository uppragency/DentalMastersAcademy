"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import type { FormState } from "@/actions/auth";
import { getCurrentProfile } from "@/lib/data";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendMail } from "@/lib/email";
import { nowMs } from "@/lib/time";

const MIN_DAYS = 3;
const emailSchema = z.string().trim().toLowerCase().email({ error: "Introdu un email valid." });

/** Student asks to hand a seat to a colleague. Staff approves from the admin. */
export async function requestTransfer(enrollmentId: string, _: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Sesiunea a expirat. Intră din nou în cont." };
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { errors: { email: [email.error.issues[0]!.message] } };
  if (email.data === profile.email.toLowerCase()) return { errors: { email: ["Introdu emailul colegului, nu al tău."] } };
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  const admin = createAdminClient();
  const { data: enr } = await admin.from("enrollments").select("id, user_id, attended, courses(title, starts_at)").eq("id", enrollmentId).maybeSingle();
  const course = (enr as unknown as { courses: { title: string; starts_at: string | null } | null } | null)?.courses;
  if (!enr || enr.user_id !== profile.id || !course) return { message: "Înscrierea nu a fost găsită." };
  if (enr.attended) return { message: "Locul nu mai poate fi transferat după participare." };
  if (!course.starts_at || Date.parse(course.starts_at) - nowMs() < MIN_DAYS * 86_400_000) {
    return { message: `Transferul se cere cu cel puțin ${MIN_DAYS} zile înainte de începerea cursului. Scrie-ne pentru cazuri speciale.` };
  }
  const { error } = await admin.from("seat_transfers").insert({ enrollment_id: enrollmentId, from_user: profile.id, to_email: email.data, note });
  if (error) return { message: error.code === "23505" ? "Există deja o cerere în așteptare pentru acest curs." : "Cererea nu a putut fi trimisă." };

  const { data: staff } = await admin.from("profiles").select("email").in("role", ["admin", "operator"]).is("disabled_at", null);
  const to = (staff ?? []).map((s) => s.email).filter(Boolean);
  if (to.length) {
    await sendMail({ to, subject: "Cerere de transfer de loc", heading: "Cerere de transfer de loc", paragraphs: [`${profile.full_name ?? profile.email} cere transferul locului la ${course.title} către ${email.data}.`], cta: { label: "Deschide cererile", href: "/admin/transferuri" }, kind: "alert" });
  }
  revalidatePath("/cont/cursuri", "layout");
  return { message: "Cererea a fost trimisă. Te anunțăm când este analizată." };
}

export async function cancelTransfer(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  await createAdminClient().from("seat_transfers").update({ status: "cancelled", decided_at: new Date().toISOString() }).eq("id", id).eq("from_user", profile.id).eq("status", "pending");
  revalidatePath("/cont/cursuri", "layout");
}

type Pending = { id: string; enrollment_id: string; from_user: string; to_email: string; status: string };

async function load(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("seat_transfers").select("id, enrollment_id, from_user, to_email, status").eq("id", id).maybeSingle();
  return { admin, t: data as Pending | null };
}

export async function approveTransfer(id: string): Promise<void> {
  const { profile } = await requireStaff();
  const { admin, t } = await load(id);
  if (!t || t.status !== "pending") return;
  const { data: target } = await admin.from("profiles").select("id, email, full_name").ilike("email", t.to_email).is("disabled_at", null).maybeSingle();
  const decline = async (reason: string) => {
    await admin.from("seat_transfers").update({ decision_note: reason }).eq("id", id);
    revalidatePath("/admin/transferuri");
  };
  if (!target) return decline("Colegul nu are cont cu acest email. Cere-i să își creeze unul, apoi aprobă din nou.");
  const { data: enr } = await admin.from("enrollments").select("id, course_id, attended, courses(title, slug)").eq("id", t.enrollment_id).maybeSingle();
  const course = (enr as unknown as { courses: { title: string; slug: string } | null } | null)?.courses;
  if (!enr || !course || enr.attended) return decline("Înscrierea nu mai poate fi transferată.");
  const { data: dup } = await admin.from("enrollments").select("id").eq("user_id", target.id).eq("course_id", enr.course_id).maybeSingle();
  if (dup) return decline("Colegul este deja înscris la acest curs.");

  const { error } = await admin.from("enrollments").update({ user_id: target.id }).eq("id", enr.id);
  if (error) return decline("Transferul a eșuat. Încearcă din nou.");
  await admin.from("seat_transfers").update({ status: "approved", decided_by: profile.id, decided_at: new Date().toISOString(), decision_note: null }).eq("id", id);
  await logAudit(profile.id, "approve_transfer", enr.id, { from: t.from_user, to: target.id });

  const { data: from } = await admin.from("profiles").select("email, full_name").eq("id", t.from_user).maybeSingle();
  await admin.from("notifications").insert([
    { user_id: target.id, kind: "info", title: `Ai primit un loc la ${course.title}`, body: "Un coleg ți-a transferat locul. Detaliile sunt în cont.", href: `/cont/cursuri/${course.slug}` },
    { user_id: t.from_user, kind: "info", title: "Transferul a fost aprobat", body: `Locul tău la ${course.title} a fost transferat.`, href: "/cont/cursuri" },
  ]);
  if (target.email) await sendMail({ to: target.email, subject: `Ai un loc la ${course.title}`, heading: "Ai primit un loc", paragraphs: [`${target.full_name ? `Bună, ${target.full_name}.` : "Bună."} ${from?.full_name ?? "Un coleg"} ți-a transferat locul la ${course.title}. Programul și detaliile sunt în contul tău.`], cta: { label: "Deschide cursul", href: `/cont/cursuri/${course.slug}` }, kind: "transfer", userId: target.id });
  if (from?.email) await sendMail({ to: from.email, subject: "Transferul de loc a fost aprobat", heading: "Transfer aprobat", paragraphs: [`Locul tău la ${course.title} a fost transferat către ${target.email}.`], kind: "transfer", userId: t.from_user });
  revalidatePath("/admin/transferuri");
}

export async function rejectTransfer(id: string, formData: FormData): Promise<void> {
  const { profile } = await requireStaff();
  const { admin, t } = await load(id);
  if (!t || t.status !== "pending") return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || null;
  await admin.from("seat_transfers").update({ status: "rejected", decided_by: profile.id, decided_at: new Date().toISOString(), decision_note: reason }).eq("id", id);
  await logAudit(profile.id, "reject_transfer", t.enrollment_id, { reason });
  await admin.from("notifications").insert({ user_id: t.from_user, kind: "info", title: "Transferul nu a fost aprobat", body: reason ?? "Scrie-ne pentru detalii.", href: "/cont/cursuri" });
  const { data: from } = await admin.from("profiles").select("email").eq("id", t.from_user).maybeSingle();
  if (from?.email) await sendMail({ to: from.email, subject: "Transferul de loc nu a fost aprobat", heading: "Transfer neaprobat", paragraphs: [reason ?? "Cererea ta de transfer nu a putut fi aprobată. Scrie-ne și găsim o soluție."], kind: "transfer", userId: t.from_user });
  revalidatePath("/admin/transferuri");
}
