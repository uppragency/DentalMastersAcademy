import type { Metadata } from "next";
import { getReports, parseRange } from "@/lib/report";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Rapoarte | Administrare", robots: { index: false } };

const kindLabel: Record<string, string> = { earn: "Puncte acordate", redeem: "Puncte folosite", restore: "Puncte returnate", expire: "Puncte expirate", adjust: "Ajustări manuale" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const r = parseRange(sp.from, sp.to);
  const rep = await getReports(r.fromIso, r.toIso);
  const total = rep.sales.reduce((s, x) => s + x.revenueCents, 0);
  const exp = (type: string) => `/admin/rapoarte/export?type=${type}&from=${r.from}&to=${r.to}`;
  const link = "rounded-full border border-line px-4 py-2 text-sm hover:border-foreground/30";

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Rapoarte</h1>
      <form className="flex flex-wrap items-end gap-4">
        <label className="text-sm">De la<input type="date" name="from" defaultValue={r.from} className="mt-1 block min-h-11 rounded-xl border border-line bg-card px-4" /></label>
        <label className="text-sm">Până la<input type="date" name="to" defaultValue={r.to} className="mt-1 block min-h-11 rounded-xl border border-line bg-card px-4" /></label>
        <button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm font-medium text-white">Aplică</button>
      </form>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">Încasări în perioadă</dt><dd className="mt-2 text-2xl font-semibold">{formatPrice(total, "EUR")}</dd></div>
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">Comenzi plătite</dt><dd className="mt-2 text-2xl font-semibold">{rep.orderCount}</dd></div>
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">Datorie în puncte (acum)</dt><dd className="mt-2 text-2xl font-semibold">{rep.livePoints} ({formatPrice(Math.round(rep.livePoints * rep.pointValueCents), "EUR")})</dd></div>
      </dl>

      <section aria-labelledby="s">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="s" className="text-lg font-semibold">Vânzări pe curs</h2><a className={link} href={exp("sales")}>Export CSV</a></div>
        <div className="overflow-x-auto rounded-3xl border border-line bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-line text-muted"><tr><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Comenzi</th><th className="px-5 py-3 font-medium">Reduceri</th><th className="px-5 py-3 font-medium">Încasat</th></tr></thead>
          <tbody>{rep.sales.map((x) => <tr key={x.course} className="border-b border-line last:border-0"><td className="px-5 py-3">{x.course}</td><td className="px-5 py-3">{x.orders}</td><td className="px-5 py-3">{formatPrice(x.discountCents, "EUR")}</td><td className="px-5 py-3 font-medium">{formatPrice(x.revenueCents, "EUR")}</td></tr>)}
            {rep.sales.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted">Nicio vânzare în perioadă.</td></tr> : null}</tbody></table></div>
      </section>

      <section aria-labelledby="c">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="c" className="text-lg font-semibold">Utilizare coduri</h2><a className={link} href={exp("codes")}>Export CSV</a></div>
        <div className="overflow-x-auto rounded-3xl border border-line bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-line text-muted"><tr><th className="px-5 py-3 font-medium">Cod</th><th className="px-5 py-3 font-medium">Comenzi</th><th className="px-5 py-3 font-medium">Reducere totală</th></tr></thead>
          <tbody>{rep.codes.map((x) => <tr key={x.code} className="border-b border-line last:border-0"><td className="px-5 py-3 font-mono">{x.code}</td><td className="px-5 py-3">{x.orders}</td><td className="px-5 py-3">{formatPrice(x.discountCents, "EUR")}</td></tr>)}
            {rep.codes.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-muted">Niciun cod folosit în perioadă.</td></tr> : null}</tbody></table></div>
      </section>

      <section aria-labelledby="p">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="p" className="text-lg font-semibold">Puncte emise și folosite</h2><a className={link} href={exp("points")}>Export CSV</a></div>
        <div className="overflow-x-auto rounded-3xl border border-line bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-line text-muted"><tr><th className="px-5 py-3 font-medium">Tip</th><th className="px-5 py-3 font-medium">Puncte</th></tr></thead>
          <tbody>{rep.points.map((x) => <tr key={x.kind} className="border-b border-line last:border-0"><td className="px-5 py-3">{kindLabel[x.kind] ?? x.kind}</td><td className="px-5 py-3 font-medium">{x.points > 0 ? "+" : ""}{x.points}</td></tr>)}
            {rep.points.length === 0 ? <tr><td colSpan={2} className="p-8 text-center text-muted">Nicio mișcare în perioadă.</td></tr> : null}</tbody></table></div>
      </section>
      <p className="text-sm text-muted">Sumele sunt în EUR, moneda cursurilor. Perioada folosește data plății (fusul orar al României).</p>
    </div>
  );
}
