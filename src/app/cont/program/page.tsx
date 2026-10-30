import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { getCurrentProfile, getLoyaltySettings, getLoyaltyState } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { tierNames, tierPerks } from "@/lib/loyalty";
import type { Tier } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Program Gold"), robots: { index: false } };
}

const kindLabel = { earn: "Câștigate", redeem: "Folosite", restore: "Returnate", expire: "Expirate", adjust: "Ajustare" } as const;

export default async function ProgramPage() {
  await getLocale();
  const profile = (await getCurrentProfile())!;
  const s = await getLoyaltySettings();
  if (!s || !s.is_active) {
    return (
      <div>
        <h1 className="font-display text-4xl font-medium">{tr("Program Gold")}</h1>
        <p className="mt-4 text-muted">{tr("Programul nu este activ momentan.")}</p>
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
        next.spend ? tr("{v1} în achiziții", { v1: formatPrice(Math.max(0, next.spend - state.spentCents), cur) }) : null,
        next.courses ? `${Math.max(0, next.courses - state.courses)} ${next.courses - state.courses === 1 ? tr("curs") : tr("cursuri")}` : null,
      ].filter(Boolean).join(tr(" sau "))
    : "";
  const perksFor = (t: Tier) => tierPerks(t, s);

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{tr("Cont")}</p>
        <h1 className="font-display mt-2 text-5xl font-medium">{tr("Program Gold")}</h1>
        <p className="mt-4 max-w-3xl text-muted">{tr("Primești puncte la fiecare achiziție și urci de nivel automat. Punctele se folosesc la checkout, ca parte din prețul următorului curs.")}</p>
      </header>

      {state.graceUntil ? (
        <p role="status" className="rounded-2xl bg-gold-soft px-5 py-4 text-sm">
          {tr("Nu mai îndeplinești condițiile pentru nivelul")}{" "}{perk.name}{tr(". Îl păstrezi până la")}{" "}{formatDate(state.graceUntil)}{tr(". O achiziție nouă îl prelungește.")}</p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label={tr("Starea ta")}>
        <div className="rounded-[2rem] bg-ink p-7 text-white">
          <p className="text-sm text-white/60">{tr("Nivelul tău")}</p>
          <p className="font-display mt-3 text-5xl">{perk.name}</p>
          <p className="mt-3 text-sm text-white/60">{tr("Reducere")}{" "}{perk.discountPercent}% · {perk.multiplier}{tr("x puncte")}</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-card p-7">
          <p className="text-sm text-muted">{tr("Puncte disponibile")}</p>
          <p className="font-display mt-3 text-5xl">{state.balance}</p>
          <p className="mt-3 text-sm text-muted">{tr("Valoare:")}{" "}{formatPrice(Math.round(state.balance * pointValue), cur)}</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-card p-7">
          <p className="text-sm text-muted">{tr("Expiră în 30 de zile")}</p>
          <p className="font-display mt-3 text-5xl">{state.expiringSoon}</p>
          <p className="mt-3 text-sm text-muted">{state.expiringAt ? `Prima expirare: ${formatDate(state.expiringAt)}` : tr("Valabilitate {points_expiry_months} de luni", { points_expiry_months: s.points_expiry_months })}</p>
        </div>
      </section>

      <section aria-labelledby="next-tier" className="rounded-[2rem] border border-line bg-card p-8">
        <h2 id="next-tier" className="font-display text-3xl">{next ? tr("Drumul tău spre {v1}", { v1: tierNames[next.id] }) : tr("Ai nivelul maxim")}</h2>
        {next ? (
          <>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={tr("Progres către {v1}", { v1: tierNames[next.id] })}>
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {percent}{tr("% completat. Mai ai")}{" "}{missing} {" "}{tr("până la")}{" "}{tierNames[next.id]}{tr(", în ultimele")}{" "}{s.window_days ?? 365} {" "}{tr("de zile.")}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">{tr("Păstrezi nivelul Platinum cât timp îndeplinești condițiile în ultimele")}{" "}{s.window_days ?? 365} {" "}{tr("de zile.")}</p>
        )}
        <p className="mt-4 text-sm text-muted">{tr("Ai cheltuit")}{" "}{formatPrice(state.spentCents, cur)} {" "}{tr("la")}{" "}{state.courses} {state.courses === 1 ? tr("curs") : tr("cursuri")} {" "}{tr("în această perioadă.")}</p>
      </section>

      <section aria-labelledby="levels">
        <h2 id="levels" className="font-display text-3xl">{tr("Nivelurile")}</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => {
            const p = perksFor(t.id);
            const here = t.id === tier;
            return (
              <article key={t.id} className={`rounded-[2rem] border p-7 ${here ? "border-gold bg-gold-soft/40" : "border-line bg-card"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{tierNames[t.id]}</h3>
                  {here ? <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">{tr("Nivelul tău")}</span> : null}
                </div>
                <p className="mt-2 text-sm text-muted">
                  {t.id === "standard" ? tr("Oricine are un cont.") : tr("{v1}{v2}{v3} în ultimele {v4} de zile.", { v1: t.spend ? formatPrice(t.spend, cur) : "", v2: t.spend && t.courses ? tr(" sau ") : "", v3: t.courses ? `${t.courses} cursuri` : "", v4: s.window_days ?? 365 })}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  <li>{tr("Reducere automată:")}{" "}<strong>{p.discountPercent}%</strong></li>
                  <li>{tr("Puncte la fiecare 1 EUR plătit:")}{" "}<strong>{p.multiplier}</strong></li>
                  <li>{tr("Plată cu puncte: maximum")}{" "}<strong>{p.capPercent}%</strong> {" "}{tr("din preț")}</li>
                  {t.id !== "standard" ? <li>{tr("Înscriere cu")}{" "}{s.early_access_hours} {" "}{tr("de ore înainte de deschidere")}</li> : null}
                  {t.id !== "standard" ? <li>{tr("Acces gratuit la activitățile marcate Gold")}</li> : null}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">{tr("1 punct =")}{" "}{(pointValue / 100).toFixed(2)} {" "}{tr("EUR. Reducerile nu se cumulează între ele (se aplică cea mai mare dintre nivel, cod și recomandare), dar punctele se pot folosi peste orice reducere, în limita plafonului.")}</p>
      </section>

      <section aria-labelledby="hist">
        <h2 id="hist" className="font-display text-3xl">{tr("Istoricul punctelor")}</h2>
        {state.history.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr><th className="p-4">{tr("Data")}</th><th className="p-4">{tr("Tip")}</th><th className="p-4">{tr("Detalii")}</th><th className="p-4 text-right">{tr("Puncte")}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {state.history.map((h) => (
                  <tr key={h.id}>
                    <td className="p-4 whitespace-nowrap">{formatDate(h.created_at)}</td>
                    <td className="p-4">{tr(kindLabel[h.kind])}</td>
                    <td className="p-4 text-muted">{h.note ?? ""}{h.kind === "earn" && h.expires_at ? tr(" · expiră {v1}", { v1: formatDate(h.expires_at) }) : ""}</td>
                    <td className={`p-4 text-right font-semibold ${h.delta >= 0 ? "text-gold" : ""}`}>{h.delta > 0 ? "+" : ""}{h.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">
            {tr("Nu ai puncte încă. Le primești după prima achiziție plătită.")}{" "}<Link className="font-medium text-foreground underline underline-offset-4" href="/cursuri">{tr("Vezi cursurile")}</Link>
          </p>
        )}
      </section>
    </div>
  );
}
