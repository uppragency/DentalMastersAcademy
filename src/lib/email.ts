import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro";

export async function sendPurchaseEmail(opts: {
  to: string;
  name: string | null;
  courseTitle: string;
  courseSlug: string;
  totalFormatted: string;
  newAccount: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("Purchase email skipped: RESEND_API_KEY or RESEND_FROM missing");
    await logEmail({ to: opts.to, subject: "Achiziția ta la Dental Masters Academy", kind: "purchase", error: "Email neconfigurat (RESEND_API_KEY / RESEND_FROM)" });
    return;
  }
  const resend = new Resend(key);
  const greeting = opts.name ? `Bună, ${opts.name},` : "Bună,";
  const accountLine = opts.newAccount
    ? `<p>Contul tău a fost creat cu adresa <strong>${escapeHtml(opts.to)}</strong>. Te poți autentifica oricând cu parola setată la comandă.</p>`
    : "";
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f1623;line-height:1.6">
    <h1 style="font-size:22px;margin:0 0 16px">Plata a fost confirmată</h1>
    <p>${escapeHtml(greeting)}</p>
    <p>Ai achiziționat cursul <strong>${escapeHtml(opts.courseTitle)}</strong> (${escapeHtml(opts.totalFormatted)}).</p>
    ${accountLine}
    <p><a href="${siteUrl()}/cont/cursuri/${encodeURIComponent(opts.courseSlug)}" style="display:inline-block;background:#0b1220;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none">Accesează cursul</a></p>
    <p style="color:#5d6675;font-size:13px">Dental Masters Academy</p>
  </div>`;
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: "Achiziția ta la Dental Masters Academy",
    html,
  });
  if (error) console.error("Resend error", error);
  await logEmail({ to: opts.to, subject: "Achiziția ta la Dental Masters Academy", kind: "purchase", providerId: data?.id, error: error ? error.message : undefined });
}

type LogRow = { to: string | string[]; subject: string; kind?: string; userId?: string; providerId?: string; error?: string };

/** Records every send attempt for the admin email log. Never throws. */
async function logEmail(row: LogRow) {
  try {
    const status = row.error ? "failed" : "sent";
    const list = Array.isArray(row.to) ? row.to : [row.to];
    await createAdminClient().from("email_log").insert(
      list.map((to) => ({ to_email: to, subject: row.subject, kind: row.kind ?? null, user_id: row.userId ?? null, status, provider_id: row.providerId ?? null, error: row.error ?? null })),
    );
  } catch (e) {
    console.error("email_log insert failed", e);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Generic branded transactional email. Returns false when email is not configured or sending fails. */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  attachments?: { filename: string; content: string }[];
  kind?: string;
  userId?: string;
  /** Marketing emails: adds an unsubscribe link and List-Unsubscribe header. */
  unsubscribe?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.warn("Email skipped: RESEND_API_KEY or RESEND_FROM missing");
    await logEmail({ to: opts.to, subject: opts.subject, kind: opts.kind, userId: opts.userId, error: "Email neconfigurat (RESEND_API_KEY / RESEND_FROM)" });
    return false;
  }
  const resend = new Resend(key);
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f1623;line-height:1.6">
    <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(opts.heading)}</h1>
    ${opts.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
    ${opts.cta ? `<p><a href="${opts.cta.href.startsWith("http") ? opts.cta.href : siteUrl() + opts.cta.href}" style="display:inline-block;background:#0b1220;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none">${escapeHtml(opts.cta.label)}</a></p>` : ""}
    <p style="color:#5d6675;font-size:13px">Dental Masters Academy</p>
    ${opts.unsubscribe ? `<p style="color:#8a93a3;font-size:12px">Primești acest email pentru că ești cursant. <a href="${opts.unsubscribe}" style="color:#8a93a3">Dezabonează-te de la recomandări</a></p>` : ""}
  </div>`;
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html,
    ...(opts.unsubscribe ? { headers: { "List-Unsubscribe": `<${opts.unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
    attachments: opts.attachments,
  });
  await logEmail({ to: opts.to, subject: opts.subject, kind: opts.kind, userId: opts.userId, providerId: data?.id, error: error ? error.message : undefined });
  if (error) {
    console.error("Resend error", error);
    return false;
  }
  return true;
}
