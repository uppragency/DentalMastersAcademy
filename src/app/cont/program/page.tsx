import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile, getLoyaltySettings, getLoyaltyState } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { tierNames, tierPerks } from "@/lib/loyalty";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = { title: "Program Gold", robots: { index: false } };

const kindLabel = { earn: "Câștigate", redeem: "Folosite", restore: "Returnate", expire: "Expirate", adjust: "Ajustare" } as const;

export default async function ProgramPage() {
  const profile = (await getCurrentProfile())!;
  const s = await getLoyaltySettings();
  if (!s || !s.is_active) {
    return (
      <div>
        <h1 className="font-display text-4xl font-medium">Program Gold</h1>
        <p className="mt-4 text-muted">Programul nu este activ momentan.</p>
      </div>
    );
  }
  const state = await getLoyaltyState(profile.id, s);
  const tier = profile.tier;
  const perk = tierPerks(tier, s);
  const cur = "EUR";
  const pointValue = Number(s.point_value_cents);
  const tiers: { id: Tier; spend: number | null; courses: number | null }[] = [
    { id: "standard", spend: null, courses: null },
    { id: "gold", spend: s.spend_threshold_cents, courses: s.courses_threshold },
    { id: "platinum", spend: s.platinum_spend_threshold_cents, courses: s.platinum_courses_threshold },
  ];
  const next = tier === "standard" ? tiers[1]! : tier === "gold" ? tiers[2]! : null;
  const ratios = next
    ? [next.spend ? state.spentCents / next.spend : null, next.courses ? state.courses / next.courses : null].filter((r): r is number => r !== null)
    : [];
  const percent = ratios.length ? Math.min(100, Math.round(Math.max(...ratios) * 100)) : 100;
  const missing = next
    ? [
        next.spend ? `${formatPrice(Math.max(0, next.spend - state.spentCents), cur)} în achiziții` : null,
        next.courses ? `${Math.max(0, next.courses - state.courses)} ${next.courses - state.courses === 1 ? "curs" : "cursuri"}` : null,
      ].filter(Boolean).join(" sau ")
    : "";
  const perksFor = (t: Tier) => tierPerks(t, s);

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cont</p>
        <h1 className="font-display mt-2 text-5xl font-medium">Program Gold</h1>
        <p className="mt-4 max-w-3xl text-muted">Primești puncte la fiecare achiziție și urci de nivel automat. Punctele se folosesc la checkout, ca parte din prețul următorului curs.</p>
      </header>

      {state.graceUntil ? (
        <p role="status" className="rounded-2xl bg-gold-soft px-5 py-4 text-sm">
          Nu mai îndeplinești condițiile pentru nivelul {perk.name}. Îl păstrezi până la {formatDate(state.graceUntil)}. O achiziție nouă îl prelungește.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label="Starea ta">
        <div className="rounded-[2rem] bg-ink p-7 text-white">
          <p className="text-sm text-white/60">Nivelul tău</p>
          <p className="font-display mt-3 text-5xl">{perk.name}</p>
          <p className="mt-3 text-sm text-white/60">Reducere {perk.discountPercent}% · {perk.multiplier}x puncte</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-card p-7">
          <p className="text-sm text-muted">Puncte disponibile</p>
          <p className="font-display mt-3 text-5xl">{state.balance}</p>
          <p className="mt-3 text-sm text-muted">Valoare: {formatPrice(Math.round(state.balance * pointValue), cur)}</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-card p-7">
          <p className="text-sm text-muted">Expiră în 30 de zile</p>
          <p className="font-display mt-3 text-5xl">{state.expiringSoon}</p>
          <p className="mt-3 text-sm text-muted">{state.expiringAt ? `Prima expirare: ${formatDate(state.expiringAt)}` : `Valabilitate ${s.points_expiry_months} de luni`}</p>
        </div>
      </section>

      <section aria-labelledby="next-tier" className="rounded-[2rem] border border-line bg-card p-8">
        <h2 id="next-tier" className="font-display text-3xl">{next ? `Drumul tău spre ${tierNames[next.id]}` : "Ai nivelul maxim"}</h2>
        {next ? (
          <>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres către ${tierNames[next.id]}`}>
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {percent}% completat. Mai ai {missing} până la {tierNames[next.id]}, în ultimele {s.window_days ?? 365} de zile.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">Păstrezi nivelul Platinum cât timp îndeplinești condițiile în ultimele {s.window_days ?? 365} de zile.</p>
        )}
        <p className="mt-4 text-sm text-muted">Ai cheltuit {formatPrice(state.spentCents, cur)} la {state.courses} {state.courses === 1 ? "curs" : "cursuri"} în această perioadă.</p>
      </section>

      <section aria-labelledby="levels">
        <h2 id="levels" className="font-display text-3xl">Nivelurile</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => {
            const p = perksFor(t.id);
            const here = t.id === tier;
            return (
              <article key={t.id} className={`rounded-[2rem] border p-7 ${here ? "border-gold bg-gold-soft/40" : "border-line bg-card"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{tierNames[t.id]}</h3>
                  {here ? <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">Nivelul tău</span> : null}
                </div>
                <p className="mt-2 text-sm text-muted">
                  {t.id === "standard" ? "Oricine are un cont." : `${t.spend ? formatPrice(t.spend, cur) : ""}${t.spend && t.courses ? " sau " : ""}${t.courses ? `${t.courses} cursuri` : ""} în ultimele ${s.window_days ?? 365} de zile.`}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  <li>Reducere automată: <strong>{p.discountPercent}%</strong></li>
                  <li>Puncte la fiecare 1 EUR plătit: <strong>{p.multiplier}</strong></li>
                  <li>Plată cu puncte: maximum <strong>{p.capPercent}%</strong> din preț</li>
                  {t.id !== "standard" ? <li>Înscriere cu {s.early_access_hours} de ore înainte de deschidere</li> : null}
                  {t.id !== "standard" ? <li>Acces gratuit la activitățile marcate Gold</li> : null}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">1 punct = {(pointValue / 100).toFixed(2)} EUR. Reducerile nu se cumulează între ele (se aplică cea mai mare dintre nivel, cod și recomandare), dar punctele se pot folosi peste orice reducere, în limita plafonului.</p>
      </section>

      <section aria-labelledby="hist">
        <h2 id="hist" className="font-display text-3xl">Istoricul punctelor</h2>
        {state.history.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr><th className="p-4">Data</th><th className="p-4">Tip</th><th className="p-4">Detalii</th><th className="p-4 text-right">Puncte</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {state.history.map((h) => (
                  <tr key={h.id}>
                    <td className="p-4 whitespace-nowrap">{formatDate(h.created_at)}</td>
                    <td className="p-4">{kindLabel[h.kind]}</td>
                    <td className="p-4 text-muted">{h.note ?? ""}{h.kind === "earn" && h.expires_at ? ` · expiră ${formatDate(h.expires_at)}` : ""}</td>
                    <td className={`p-4 text-right font-semibold ${h.delta >= 0 ? "text-gold" : ""}`}>{h.delta > 0 ? "+" : ""}{h.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Nu ai puncte încă. Le primești după prima achiziție plătită. <Link className="font-medium text-foreground underline underline-offset-4" href="/cursuri">Vezi cursurile</Link>
          </p>
        )}
      </section>
    </div>
  );
}
