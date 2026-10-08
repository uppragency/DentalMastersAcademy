"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import type { FormState } from "@/actions/auth";
import { requireFullAdmin, requireStaff } from "@/lib/staff";
import { getStripe } from "@/lib/stripe";
import { sendMail, sendPurchaseEmail } from "@/lib/email";
import { issueInvoice } from "@/lib/invoicing";
import { formatPrice } from "@/lib/format";
import { anonymizeAccount } from "@/lib/anonymize";
import { logAudit } from "@/lib/audit";
import { processWaitlist } from "@/lib/waitlist";

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
const fe = (e: z.ZodError) => ({ errors: z.flattenError(e).fieldErrors as Record<string, string[]> });
const reason = z.string().trim().min(3, { error: "Introdu motivul (minimum 3 caractere)." }).max(300);

function rpcMessage(m: string) {
  if (m.includes("already_enrolled")) return "Utilizatorul este deja înscris la acest curs.";
  if (m.includes("course_not_available")) return "Cursul nu a fost găsit.";
  if (m.includes("not_paid")) return "Doar comenzile plătite pot fi rambursate.";
  return "Operațiunea nu a putut fi făcută.";
}

async function note(admin: Awaited<ReturnType<typeof requireStaff>>["admin"], userId: string, authorId: string, text: string) {
  await admin.from("user_notes").insert({ user_id: userId, author_id: authorId, note: text });
}

/* Users */

const profileSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Introdu numele." }).max(120),
  phone: z.string().trim().max(40).optional(),
  specialization: z.string().trim().max(120).optional(),
  role: z.enum(["student", "operator", "admin"]).optional(),
});

export async function updateUserProfile(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, isAdmin, profile } = await requireStaff();
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: opt(formData.get("phone")),
    specialization: opt(formData.get("specialization")),
    role: opt(formData.get("role")),
  });
  if (!parsed.success) return fe(parsed.error);
  const d = parsed.data;
  const patch: Record<string, unknown> = { full_name: d.full_name, phone: d.phone ?? null, specialization: d.specialization ?? null };
  if (d.role && isAdmin && userId !== profile.id) patch.role = d.role;
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return { message: "Datele nu au putut fi salvate." };
  if (patch.role) await note(admin, userId, profile.id, `Rol schimbat în ${d.role}.`);
  if (patch.role) await logAudit(profile.id, "role_change", userId, { role: d.role });
  revalidatePath(`/admin/useri/${userId}`);
  return { message: "Datele au fost salvate." };
}

export async function addUserNote(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireStaff();
  const parsed = z.object({ note: z.string().trim().min(2, { error: "Scrie o notă." }).max(1000) }).safeParse({ note: formData.get("note") });
  if (!parsed.success) return fe(parsed.error);
  await note(admin, userId, profile.id, parsed.data.note);
  revalidatePath(`/admin/useri/${userId}`);
  return { message: "Notă adăugată." };
}

export async function enrollUser(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireStaff();
  const parsed = z.object({ course_id: z.uuid({ error: "Alege cursul." }), reason }).safeParse({ course_id: formData.get("course_id"), reason: formData.get("reason") });
  if (!parsed.success) return fe(parsed.error);
  const { error } = await admin.rpc("admin_enroll", { p_user: userId, p_course: parsed.data.course_id, p_note: parsed.data.reason, p_by: profile.id });
  if (error) return { message: rpcMessage(error.message) };
  await logAudit(profile.id, "enroll_user", userId, { course_id: parsed.data.course_id, reason: parsed.data.reason });
  revalidatePath(`/admin/useri/${userId}`);
  return { message: "Utilizatorul a fost înscris." };
}

export async function manualOrder(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireStaff();
  const parsed = z
    .object({ course_id: z.uuid({ error: "Alege cursul." }), amount: z.coerce.number().min(0, { error: "Suma nu poate fi negativă." }).max(100000), reason })
    .safeParse({ course_id: formData.get("course_id"), amount: formData.get("amount"), reason: formData.get("reason") });
  if (!parsed.success) return fe(parsed.error);
  const { error } = await admin.rpc("admin_manual_order", {
    p_user: userId,
    p_course: parsed.data.course_id,
    p_amount_cents: Math.round(parsed.data.amount * 100),
    p_note: parsed.data.reason,
    p_by: profile.id,
  });
  if (error) return { message: rpcMessage(error.message) };
  await logAudit(profile.id, "manual_order", userId, { course_id: parsed.data.course_id, amount: parsed.data.amount, reason: parsed.data.reason });
  revalidatePath(`/admin/useri/${userId}`);
  revalidatePath("/admin/comenzi");
  return { message: "Comanda manuală a fost creată. Punctele și nivelul au fost actualizate." };
}

export async function revokeEnrollment(userId: string, enrollmentId: string) {
  const { admin, profile } = await requireFullAdmin();
  const { data: e } = await admin.from("enrollments").select("course_id, courses(title)").eq("id", enrollmentId).eq("user_id", userId).maybeSingle();
  await admin.from("enrollments").delete().eq("id", enrollmentId).eq("user_id", userId);
  const title = (e?.courses as unknown as { title: string } | null)?.title ?? "curs";
  await note(admin, userId, profile.id, `Înscrierea la ${title} a fost retrasă.`);
  await logAudit(profile.id, "revoke_enrollment", userId, { course: title });
  if (e?.course_id) await processWaitlist(e.course_id);
  revalidatePath(`/admin/useri/${userId}`);
}

export async function setUserTier(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  const parsed = z
    .object({ tier: z.enum(["gold", "platinum", "standard"]), until: z.string().optional(), reason })
    .safeParse({ tier: formData.get("tier"), until: opt(formData.get("until")), reason: formData.get("reason") });
  if (!parsed.success) return fe(parsed.error);
  const d = parsed.data;
  const until = d.until ? new Date(`${d.until}T23:59:59+03:00`).toISOString() : null;
  const { error } = await admin.rpc("admin_set_tier", { p_user: userId, p_tier: d.tier, p_until: until, p_reason: d.reason, p_by: profile.id });
  if (error) return { message: "Nivelul nu a putut fi setat." };
  await logAudit(profile.id, "set_tier", userId, { tier: d.tier, until: d.until ?? null, reason: d.reason });
  await note(admin, userId, profile.id, `Nivel setat manual: ${d.tier}${d.until ? ` până la ${d.until}` : ""}. Motiv: ${d.reason}`);
  revalidatePath(`/admin/useri/${userId}`);
  revalidatePath("/admin/gold");
  return { message: "Nivelul manual a fost setat." };
}

export async function clearUserTier(userId: string) {
  const { admin, profile } = await requireFullAdmin();
  await admin.rpc("admin_set_tier", { p_user: userId, p_tier: null, p_until: null, p_reason: null, p_by: profile.id });
  await logAudit(profile.id, "clear_tier", userId);
  await note(admin, userId, profile.id, "Nivelul manual a fost eliminat. Nivelul revine la calculul automat.");
  revalidatePath(`/admin/useri/${userId}`);
  revalidatePath("/admin/gold");
}

export async function adjustUserPoints(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  const parsed = z
    .object({ delta: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((v) => v !== 0, { error: "Introdu un număr diferit de 0." }), reason })
    .safeParse({ delta: formData.get("delta"), reason: formData.get("reason") });
  if (!parsed.success) return fe(parsed.error);
  const { data, error } = await admin.rpc("admin_adjust_points", { p_user: userId, p_delta: parsed.data.delta, p_note: parsed.data.reason });
  if (error) return { message: "Ajustarea nu a putut fi făcută." };
  await logAudit(profile.id, "adjust_points", userId, { delta: parsed.data.delta, reason: parsed.data.reason });
  await note(admin, userId, profile.id, `Puncte ${parsed.data.delta > 0 ? "adăugate" : "retrase"}: ${parsed.data.delta}. Motiv: ${parsed.data.reason}`);
  revalidatePath(`/admin/useri/${userId}`);
  return { message: `Sold actual: ${data} puncte.` };
}

export async function sendPasswordReset(userId: string): Promise<void> {
  const { admin } = await requireStaff();
  const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (!data?.email) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await admin.auth.resetPasswordForEmail(data.email, { redirectTo: `${site}/auth/callback?next=/cont/profil` });
}

export async function toggleUserDisabled(userId: string, disable: boolean) {
  const { admin, profile } = await requireFullAdmin();
  if (userId === profile.id) return;
  await admin.auth.admin.updateUserById(userId, { ban_duration: disable ? "876000h" : "none" });
  await admin.from("profiles").update({ disabled_at: disable ? new Date().toISOString() : null }).eq("id", userId);
  await note(admin, userId, profile.id, disable ? "Cont dezactivat." : "Cont reactivat.");
  await logAudit(profile.id, disable ? "disable_user" : "enable_user", userId);
  revalidatePath(`/admin/useri/${userId}`);
}

/** GDPR erasure: scrubs personal data, keeps orders and invoices that must be retained. */
export async function anonymizeUser(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  if (formData.get("confirm") !== "ANONIMIZEAZĂ") return { message: "Scrie ANONIMIZEAZĂ pentru confirmare." };
  if (userId === profile.id) return { message: "Nu îți poți anonimiza propriul cont." };
  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!target) return { message: "Contul nu a fost găsit." };
  if (target.role === "admin" || target.role === "operator") return { message: "Conturile de administrare nu se anonimizează. Schimbă mai întâi rolul." };
  if (!(await anonymizeAccount(admin, userId))) return { message: "Anonimizarea a eșuat." };
  await logAudit(profile.id, "anonymize_user", userId);
  await note(admin, userId, profile.id, "Cont anonimizat la cerere (GDPR). Comenzile și facturile sunt păstrate conform obligațiilor legale.");
  revalidatePath(`/admin/useri/${userId}`);
  return { message: "Contul a fost anonimizat." };
}

/* Orders */

export async function refundOrder(orderId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  const parsed = z.object({ reason, amount: z.coerce.number().min(0).max(100000).optional() }).safeParse({ reason: formData.get("reason"), amount: opt(formData.get("amount")) });
  if (!parsed.success) return fe(parsed.error);
  const { data: o } = await admin
    .from("orders")
    .select("id, status, source, stripe_payment_intent, user_id, total_cents, refunded_cents, currency, order_items(course_id)")
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return { message: "Comanda nu a fost găsită." };
  if (o.status !== "paid") return { message: "Doar comenzile plătite pot fi rambursate." };

  const remaining = o.total_cents - o.refunded_cents;
  const wanted = parsed.data.amount ? Math.round(parsed.data.amount * 100) : remaining;
  if (wanted <= 0 || wanted > remaining) return { errors: { amount: [`Suma maximă rambursabilă este ${formatPrice(remaining, o.currency.trim())}.`] } };
  const full = wanted === remaining;

  if (o.source === "stripe" && o.stripe_payment_intent) {
    const stripe = getStripe();
    if (!stripe) return { message: "Stripe nu este configurat, rambursarea nu se poate face." };
    try {
      await stripe.refunds.create({ payment_intent: o.stripe_payment_intent, ...(full && o.refunded_cents === 0 ? {} : { amount: wanted }) });
    } catch (e) {
      return { message: `Stripe a refuzat rambursarea: ${e instanceof Error ? e.message : "eroare necunoscută"}` };
    }
  }

  if (!full) {
    await admin.from("orders").update({ refunded_cents: o.refunded_cents + wanted }).eq("id", orderId);
    await note(admin, o.user_id, profile.id, `Rambursare parțială de ${formatPrice(wanted, o.currency.trim())}. Motiv: ${parsed.data.reason}`);
    await logAudit(profile.id, "partial_refund", orderId, { cents: wanted, reason: parsed.data.reason });
    revalidatePath(`/admin/comenzi/${orderId}`);
    return { message: `Rambursare parțială înregistrată: ${formatPrice(wanted, o.currency.trim())}. Înscrierea și punctele rămân neschimbate.` };
  }

  await admin.from("enrollments").delete().eq("order_id", orderId);
  const { error } = await admin.rpc("admin_refund_order", { p_order: orderId, p_reason: parsed.data.reason, p_by: profile.id });
  if (error) return { message: "Banii au fost returnați în Stripe, dar comanda nu s-a actualizat. Reîncearcă sau actualizează manual." };
  await admin.from("orders").update({ refunded_cents: o.total_cents }).eq("id", orderId);
  await logAudit(profile.id, "refund", orderId, { cents: wanted, reason: parsed.data.reason });
  for (const i of (o.order_items ?? []) as { course_id: string }[]) await processWaitlist(i.course_id);
  revalidatePath(`/admin/comenzi/${orderId}`);
  revalidatePath("/admin/comenzi");
  return { message: "Comanda a fost rambursată. Înscrierea a fost retrasă, iar punctele au fost corectate." };
}

export async function markOrderPaid(orderId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  const parsed = z.object({ reason }).safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return fe(parsed.error);
  const { data: o } = await admin.from("orders").select("status, user_id, source").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pending") return { message: "Doar comenzile în așteptare pot fi marcate plătite." };
  const transfer = o.source === "transfer";
  const { error } = await admin.rpc("fulfill_order", { p_order: orderId, p_session: null, p_payment_intent: null });
  if (error) return { message: "Comanda nu a putut fi marcată plătită." };
  await admin.from("orders").update({ provider: transfer ? "transfer" : "manual", provider_ref: transfer ? "transfer" : "manual", source: transfer ? "transfer" : "manual", manual_note: parsed.data.reason }).eq("id", orderId);
  await note(admin, o.user_id, profile.id, `Comandă marcată plătită${transfer ? " (transfer bancar)" : " manual"}. Motiv: ${parsed.data.reason}`);
  await logAudit(profile.id, "mark_paid", orderId, { source: o.source, reason: parsed.data.reason });
  if (transfer) {
    await resendConfirmation(orderId);
    await issueInvoice(orderId);
  }
  revalidatePath(`/admin/comenzi/${orderId}`);
  return { message: "Comanda este marcată plătită. Înscrierea și punctele au fost acordate." + (transfer ? " Confirmarea a fost trimisă, iar factura a fost emisă dacă SmartBill este configurat." : "") };
}

export async function cancelPendingOrder(orderId: string) {
  const { admin, profile } = await requireStaff();
  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
  await logAudit(profile.id, "cancel_order", orderId);
  revalidatePath(`/admin/comenzi/${orderId}`);
  revalidatePath("/admin/comenzi");
}

export async function resendConfirmation(orderId: string) {
  const { admin } = await requireStaff();
  const { data } = await admin
    .from("orders")
    .select("total_cents, currency, status, profiles!orders_user_id_fkey(email, full_name), order_items(courses(title, slug))")
    .eq("id", orderId)
    .maybeSingle();
  const row = data as unknown as {
    total_cents: number; currency: string; status: string;
    profiles: { email: string; full_name: string | null } | null;
    order_items: { courses: { title: string; slug: string } | null }[];
  } | null;
  const course = row?.order_items?.[0]?.courses;
  if (!row || row.status !== "paid" || !row.profiles || !course) return;
  await sendPurchaseEmail({
    to: row.profiles.email,
    name: row.profiles.full_name,
    courseTitle: course.title,
    courseSlug: course.slug,
    totalFormatted: formatPrice(row.total_cents, row.currency.trim()),
    newAccount: false,
  });
}

export async function retryInvoice(orderId: string) {
  const { profile } = await requireFullAdmin();
  await logAudit(profile.id, "retry_invoice", orderId);
  await issueInvoice(orderId);
  revalidatePath(`/admin/comenzi/${orderId}`);
}

/* Email to a segment */

const campaignSchema = z.object({
  subject: z.string().trim().min(3, { error: "Introdu subiectul." }).max(150),
  body: z.string().trim().min(10, { error: "Scrie mesajul." }).max(5000),
  audience: z.enum(["all", "standard", "gold", "platinum", "enrolled", "not_enrolled"]),
  course_id: z.string().optional(),
});

export async function sendCampaign(_: FormState, formData: FormData): Promise<FormState> {
  const { admin, profile } = await requireFullAdmin();
  const parsed = campaignSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    course_id: opt(formData.get("course_id")),
  });
  if (!parsed.success) return fe(parsed.error);
  const d = parsed.data;
  if ((d.audience === "enrolled" || d.audience === "not_enrolled") && !d.course_id) return { errors: { course_id: ["Alege cursul."] } };
  if (formData.get("confirm") !== "on") return { message: "Bifează confirmarea de trimitere." };
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return { message: "Emailul nu este configurat (RESEND_API_KEY și RESEND_FROM)." };

  let q = admin.from("profiles").select("id, email, full_name").is("disabled_at", null).not("email", "like", "%@anonim.invalid");
  if (d.audience === "standard" || d.audience === "gold" || d.audience === "platinum") q = q.eq("tier", d.audience);
  const { data: people } = await q.limit(2000);
  let list = people ?? [];
  if (d.audience === "enrolled" || d.audience === "not_enrolled") {
    const { data: enr } = await admin.from("enrollments").select("user_id").eq("course_id", d.course_id!);
    const ids = new Set((enr ?? []).map((e) => e.user_id));
    list = list.filter((p) => (d.audience === "enrolled" ? ids.has(p.id) : !ids.has(p.id)));
  }
  if (list.length === 0) return { message: "Segmentul nu are destinatari." };
  if (list.length > 500) return { message: `Segmentul are ${list.length} destinatari. Limita este 500 per trimitere, restrânge segmentul.` };

  const paragraphs = d.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < list.length; i += 10) {
    const results = await Promise.all(
      list.slice(i, i + 10).map((p) =>
        sendMail({ to: p.email, subject: d.subject, heading: d.subject, paragraphs: [p.full_name ? `Bună, ${p.full_name}.` : "Bună.", ...paragraphs] }),
      ),
    );
    for (const ok of results) {
      if (ok) sent++;
      else failed++;
    }
  }
  await logAudit(profile.id, "send_campaign", d.subject, { sent, failed, audience: d.audience });
  await admin.from("email_campaigns").insert({
    subject: d.subject,
    body: d.body,
    segment: { audience: d.audience, course_id: d.course_id ?? null },
    recipients: sent,
    failed,
    created_by: profile.id,
  });
  revalidatePath("/admin/email");
  return { message: `Trimis către ${sent} destinatari${failed ? `, ${failed} eșuate` : ""}.` };
}
