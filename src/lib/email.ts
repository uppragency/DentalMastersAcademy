import "server-only";
import { Resend } from "resend";

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
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: "Achiziția ta la Dental Masters Academy",
    html,
  });
  if (error) console.error("Resend error", error);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
