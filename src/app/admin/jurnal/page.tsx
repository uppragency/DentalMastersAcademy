import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Jurnal modificări | Administrare", robots: { index: false } };

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
const tableLabel: Record<string, string> = {
  courses: "Curs", enrollments: "Înscriere", discount_codes: "Cod reducere", loyalty_settings: "Setări Gold", profiles: "Profil",
};
const actionLabel: Record<string, string> = { insert: "creat", update: "modificat", delete: "șters" };

const watched = ["price_cents", "status", "role", "tier", "capacity", "active", "value", "gold_discount_percent", "starts_at", "currency"];

function changes(oldD: Record<string, unknown> | null, newD: Record<string, unknown> | null) {
  if (!oldD || !newD) return "";
  return watched.filter((k) => k in newD && JSON.stringify(oldD[k]) !== JSON.stringify(newD[k])).map((k) => `${k}: ${JSON.stringify(oldD[k])} → ${JSON.stringify(newD[k])}`).join("; ");
}

export default async function AdminAudit() {
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(200);
  const ids = [...new Set((data ?? []).map((r) => r.actor).filter(Boolean))] as string[];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await createAdminClient().from("profiles").select("id, email").in("id", ids);
    for (const p of profiles ?? []) names[p.id] = p.email;
  }
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Jurnal modificări</h1>
      <p className="mt-2 text-sm text-muted">Cine a schimbat prețuri, statusuri, coduri, roluri sau a acordat acces. Ultimele 200 de evenimente.</p>
      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-4">Când</th><th className="p-4">Cine</th><th className="p-4">Ce</th><th className="p-4">Detalii</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((r) => {
              const row = (r.new_data ?? r.old_data) as Record<string, unknown> | null;
              const label = String(row?.title ?? row?.code ?? row?.email ?? r.row_id ?? "");
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap p-4">{fmt.format(new Date(r.at))}</td>
                  <td className="p-4">{r.actor ? names[r.actor] ?? "utilizator" : "sistem"}</td>
                  <td className="p-4">{tableLabel[r.table_name] ?? r.table_name} {actionLabel[r.action] ?? r.action}<span className="block text-xs text-muted">{label}</span></td>
                  <td className="p-4 text-xs text-muted">{changes(r.old_data, r.new_data)}</td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted">Nicio modificare înregistrată.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
