import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Jurnal emailuri | Administrare", robots: { index: false } };

const statusLabel: Record<string, string> = { sent: "Trimis", delivered: "Livrat", bounced: "Respins", complained: "Marcat spam", delayed: "Întârziat", failed: "Eșuat" };
const kindLabel: Record<string, string> = { purchase: "Achiziție", waitlist: "Listă de așteptare", recovery: "Comandă neplătită", transfer: "Transfer bancar", reminder: "Reminder curs", alert: "Alertă echipă", campaign: "Campanie", certificate: "Adeverință", announcement: "Anunț curs" };
const PAGE = 50;

export default async function EmailLog({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; pagina?: string }> }) {
  const { admin } = await requireStaff();
  const sp = await searchParams;
  const status = Object.keys(statusLabel).includes(sp.status ?? "") ? sp.status! : "";
  const q = (sp.q ?? "").trim().slice(0, 100).replace(/[%,()]/g, "");
  const page = Math.max(1, Number(sp.pagina) || 1);
  let query = admin.from("email_log").select("id, to_email, subject, kind, status, error, created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("to_email", `%${q}%`);
  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number, s = status) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...(s ? { status: s } : {}), pagina: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Jurnal emailuri</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Ce email a primit fiecare client și dacă a fost livrat. Statusul „Livrat” sau „Respins” apare doar după ce webhook-ul Resend este activ (vezi pagina Sistem).</p>
      <form className="mt-6 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Caută după email" aria-label="Caută după email" className="min-h-11 w-full rounded-full border border-line bg-card px-5 text-sm outline-none focus:border-gold sm:w-80" />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm font-medium text-white">Caută</button>
      </form>
      <nav aria-label="Filtru status" className="mt-4 flex flex-wrap gap-2 text-sm">
        {[["", "Toate"], ...Object.entries(statusLabel)].map(([k, l]) => (
          <Link key={k} href={href(1, k)} aria-current={status === k ? "page" : undefined} className={`rounded-full px-4 py-2 ${status === k ? "bg-ink text-white" : "border border-line text-muted hover:text-foreground"}`}>{l}</Link>
        ))}
      </nav>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Destinatar</th><th className="px-5 py-3 font-medium">Subiect</th><th className="px-5 py-3 font-medium">Tip</th><th className="px-5 py-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-5 py-3">{formatDate(m.created_at)}</td>
                <td className="px-5 py-3">{m.to_email}</td>
                <td className="px-5 py-3">{m.subject}</td>
                <td className="px-5 py-3 text-muted">{m.kind ? kindLabel[m.kind] ?? m.kind : "-"}</td>
                <td className="px-5 py-3">{statusLabel[m.status] ?? m.status}{m.error ? <span className="block text-xs text-red-700">{m.error}</span> : null}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted">Niciun email înregistrat.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="underline underline-offset-4">← Anterioare</Link> : <span />}
          <span className="text-muted">Pagina {page} din {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="underline underline-offset-4">Următoare →</Link> : <span />}
        </div>
      ) : null}
    </>
  );
}
