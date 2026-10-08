import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAdmin } from "@/lib/staff";

export const metadata: Metadata = { title: "Jurnal modificări | Administrare", robots: { index: false } };

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
const tableLabel: Record<string, string> = {
  courses: "Curs", enrollments: "Înscriere", discount_codes: "Cod reducere", loyalty_settings: "Setări Gold", profiles: "Profil", orders: "Comandă",
  testimonials: "Testimonial", blog_posts: "Articol blog", trainers: "Lector", events: "Eveniment", site_content: "Conținut site", tier_overrides: "Nivel manual", admin: "Acțiune",
};
const actionLabel: Record<string, string> = {
  insert: "creat", update: "modificat", delete: "șters",
  refund: "rambursare integrală", partial_refund: "rambursare parțială", mark_paid: "comandă marcată plătită", cancel_order: "comandă anulată", transfer_order: "comandă transfer creată",
  manual_order: "comandă manuală", enroll_user: "înscriere fără plată", revoke_enrollment: "înscriere retrasă", set_tier: "nivel setat", clear_tier: "nivel manual eliminat",
  adjust_points: "puncte ajustate", role_change: "rol schimbat", disable_user: "cont dezactivat", enable_user: "cont reactivat", anonymize_user: "cont anonimizat",
  retry_invoice: "factură reîncercată", send_campaign: "campanie trimisă", reprocess_stripe_event: "eveniment Stripe reprocesat", recovery_email: "email de reamintire",
  waitlist_offer: "loc oferit", waitlist_remove: "eliminat din așteptare", waitlist_process: "listă procesată", approve_testimonial: "testimonial aprobat", reject_testimonial: "testimonial respins",
};
const watched = ["price_cents", "status", "role", "tier", "capacity", "active", "value", "gold_discount_percent", "starts_at", "currency", "is_published", "published", "published_at", "publish_at", "refunded_cents", "total_cents"];
const PAGE = 100;

function changes(oldD: Record<string, unknown> | null, newD: Record<string, unknown> | null, action: string) {
  if (action === "admin") return newD && Object.keys(newD).length ? Object.entries(newD).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("; ") : "";
  if (!oldD || !newD) return "";
  if ("value" in newD && "key" in newD) return `conținut „${String(newD.key)}” actualizat`;
  return watched.filter((k) => k in newD && JSON.stringify(oldD[k]) !== JSON.stringify(newD[k])).map((k) => `${k}: ${JSON.stringify(oldD[k])} → ${JSON.stringify(newD[k])}`).join("; ");
}

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ tip?: string; pagina?: string }> }) {
  const { admin } = await requireFullAdmin();
  const sp = await searchParams;
  const tip = Object.keys(tableLabel).includes(sp.tip ?? "") ? sp.tip! : "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  let q = admin.from("audit_log").select("*", { count: "exact" }).order("at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (tip) q = q.eq("table_name", tip);
  const { data, count } = await q;
  const ids = [...new Set((data ?? []).map((r) => r.actor).filter(Boolean))] as string[];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await admin.from("profiles").select("id, email").in("id", ids);
    for (const p of profiles ?? []) names[p.id] = p.email;
  }
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number, t = tip) => `?${new URLSearchParams({ ...(t ? { tip: t } : {}), pagina: String(p) })}`;
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-semibold tracking-tight">Jurnal modificări</h1>
      <p className="mt-2 text-sm text-muted">Cine a schimbat prețuri, comenzi, coduri, niveluri, puncte, roluri sau conținut. „Sistem” înseamnă o modificare automată (plată Stripe, sarcină zilnică).</p>
      <nav aria-label="Filtru" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[["", "Toate"], ...Object.entries(tableLabel)].map(([k, l]) => (
          <Link key={k} href={href(1, k)} aria-current={tip === k ? "page" : undefined} className={`rounded-full px-4 py-2 ${tip === k ? "bg-ink text-white" : "border border-line text-muted hover:text-foreground"}`}>{l}</Link>
        ))}
      </nav>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-4">Când</th><th className="p-4">Cine</th><th className="p-4">Ce</th><th className="p-4">Detalii</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((r) => {
              const row = (r.new_data ?? r.old_data) as Record<string, unknown> | null;
              const label = r.table_name === "admin" ? String(r.row_id ?? "") : String(row?.title ?? row?.code ?? row?.email ?? row?.key ?? r.row_id ?? "");
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap p-4">{fmt.format(new Date(r.at))}</td>
                  <td className="p-4">{r.actor ? names[r.actor] ?? "utilizator" : "sistem"}</td>
                  <td className="p-4">{r.table_name === "admin" ? "" : `${tableLabel[r.table_name] ?? r.table_name} `}{actionLabel[r.action] ?? r.action}<span className="block max-w-xs truncate text-xs text-muted">{label}</span></td>
                  <td className="p-4 text-xs text-muted">{changes(r.old_data as Record<string, unknown> | null, r.new_data as Record<string, unknown> | null, r.table_name === "admin" ? "admin" : r.action)}</td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted">Nicio modificare înregistrată.</td></tr> : null}
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
    </div>
  );
}
