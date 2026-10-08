import type { Metadata } from "next";
import { AdjustPointsForm, LoyaltyForm } from "@/components/admin-forms";
import { getLoyaltySettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Program Gold | Administrare", robots: { index: false } };

type Row = { id: string; kind: string; delta: number; note: string | null; created_at: string; profiles: { email: string } | null };

export default async function AdminGold() {
  const settings = await getLoyaltySettings();
  if (!settings) return <p>Setările programului lipsesc din baza de date.</p>;
  const supabase = await createClient();
  const { data } = await supabase.from("points_ledger").select("id, kind, delta, note, created_at, profiles(email)").order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">Program Gold</h1>
        <LoyaltyForm settings={settings} />
      </section>
      <section aria-labelledby="adj">
        <h2 id="adj" className="text-2xl font-semibold tracking-tight">Ajustare manuală puncte</h2>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><AdjustPointsForm /></div>
      </section>
      <section aria-labelledby="log">
        <h2 id="log" className="text-2xl font-semibold tracking-tight">Ultimele mișcări de puncte</h2>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Data</th><th className="p-4">Cont</th><th className="p-4">Tip</th><th className="p-4">Detalii</th><th className="p-4 text-right">Puncte</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-4 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="p-4">{r.profiles?.email ?? ""}</td>
                  <td className="p-4">{r.kind}</td>
                  <td className="p-4 text-muted">{r.note ?? ""}</td>
                  <td className="p-4 text-right font-semibold">{r.delta > 0 ? "+" : ""}{r.delta}</td>
                </tr>
              ))}
              {rows.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted">Nicio mișcare încă.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
