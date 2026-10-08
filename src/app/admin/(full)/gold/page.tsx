import type { Metadata } from "next";
import { AdjustPointsForm, LoyaltyForm } from "@/components/admin-forms";
import { getLoyaltySettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { clearUserTier } from "@/actions/staff";
import { Button } from "@/components/ui";
import { tierNames } from "@/lib/loyalty";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = { title: "Program Gold | Administrare", robots: { index: false } };

type Row = { id: string; kind: string; delta: number; note: string | null; created_at: string; profiles: { email: string } | null };

export default async function AdminGold() {
  const settings = await getLoyaltySettings();
  if (!settings) return <p>Setările programului lipsesc din baza de date.</p>;
  const supabase = await createClient();
  const { data } = await supabase.from("points_ledger").select("id, kind, delta, note, created_at, profiles(email)").order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as Row[];
  const { data: ov } = await supabase.from("tier_overrides").select("user_id, tier, until, reason, profiles!user_id(email, full_name)").eq("active", true);
  const overrides = (ov ?? []) as unknown as { user_id: string; tier: Tier; until: string | null; reason: string | null; profiles: { email: string; full_name: string | null } | null }[];
  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">Program Gold</h1>
        <LoyaltyForm settings={settings} />
      </section>
      <section aria-labelledby="ovr">
        <h2 id="ovr" className="text-2xl font-semibold tracking-tight">Niveluri setate manual</h2>
        <p className="mt-2 text-sm text-muted">Nivelul se setează din fișa userului. Aici vezi și elimini setările active.</p>
        <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-card text-sm">
          {overrides.map((o) => (
            <li key={o.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span><Link href={`/admin/useri/${o.user_id}`} className="font-medium underline-offset-4 hover:underline">{o.profiles?.full_name ?? o.profiles?.email}</Link><span className="block text-muted">{tierNames[o.tier]}{o.until ? ` până la ${formatDate(o.until)}` : ", fără expirare"}{o.reason ? ` · ${o.reason}` : ""}</span></span>
              <form action={clearUserTier.bind(null, o.user_id)}><Button type="submit" variant="ghost" className="min-h-9 px-4">Elimină</Button></form>
            </li>
          ))}
          {overrides.length === 0 ? <li className="px-5 py-6 text-muted">Niciun nivel setat manual.</li> : null}
        </ul>
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
