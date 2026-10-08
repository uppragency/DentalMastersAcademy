import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { getCourses, getCurrentProfile, getGoldProgress, getLoyaltySettings, getMyEnrollments } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { CourseCard } from "@/components/course-card";
import { Badges, JourneyMap, type JourneyNode } from "@/components/journey-map";
import { isEnded } from "@/lib/format";

export const metadata: Metadata = { title: "Contul meu", robots: { index: false } };

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - nowMs()) / 86_400_000);
}

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ plata?: string }> }) {
  const { plata } = await searchParams;
  const profile = (await getCurrentProfile())!;
  const [enrollments, loyalty] = await Promise.all([getMyEnrollments(profile.id), getLoyaltySettings()]);
  const gold = await getGoldProgress(profile.id, loyalty);
  const isGold = profile.tier === "gold";
  const firstName = (profile.full_name ?? "").split(" ")[0];

  const courses = enrollments.map((e) => e.courses).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const upcoming = courses
    .filter((c) => c.starts_at && new Date(c.starts_at).getTime() >= nowMs())
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
  const next = upcoming[0];
  const owned = new Set(courses.map((c) => c.id));
  const allCourses = await getCourses();
  const suggestions = allCourses.filter((c) => !owned.has(c.id) && !isEnded(c, nowMs())).slice(0, 2);
  const attendedIds = new Set(enrollments.filter((e) => e.attended).map((e) => e.courses?.id));
  const journey: JourneyNode[] = allCourses.map((c) => ({
    course: c,
    state: owned.has(c.id) ? (attendedIds.has(c.id) || isEnded(c, nowMs()) ? "done" : "booked") : "open",
  }));

  const stats = [
    { label: "Cursuri achiziționate", value: String(courses.length) },
    { label: "Total investit", value: formatPrice(gold.spentCents, "EUR") },
    { label: "Economisit cu Gold", value: formatPrice(gold.savedCents, "EUR") },
  ];

  return (
    <div className="space-y-10">
      {plata === "succes" ? (
        <p role="status" className="rounded-2xl bg-gold-soft px-5 py-4 text-sm">
          Plata a fost primită. Cursul apare în lista ta în câteva secunde; vei primi și un email de confirmare.
        </p>
      ) : null}

      <header>
        <Eyebrow>Contul meu</Eyebrow>
        <h1 className="font-display mt-4 text-5xl font-medium sm:text-6xl">Bună{firstName ? `, ${firstName}` : ""}.</h1>
        <div className="mt-5"><Badges courses={courses.length} gold={isGold} /></div>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[2rem] border border-line bg-card p-7">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="font-display mt-3 text-5xl">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="gold-title" className={`rounded-[2rem] p-8 sm:p-10 ${isGold ? "bg-gradient-to-br from-[#14100a] to-[#2e220d] text-white" : "border border-line bg-card"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isGold ? "text-[#d9b873]" : "text-gold"}`}>Program Gold</p>
        <h2 id="gold-title" className="mt-2 font-display text-3xl">
          {isGold ? "Ești membru Gold" : "Drumul tău spre Gold"}
        </h2>
        {isGold ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
            Ai reducere {Number(loyalty?.gold_discount_percent ?? 0)}% la cursurile viitoare, aplicată automat la comandă, și acces gratuit la activitățile marcate Gold.
          </p>
        ) : gold.active ? (
          <>
            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={gold.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres către statusul Gold"
            >
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${gold.percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {gold.percent}% completat.{" "}
              {[
                gold.remainingCents !== null ? `Mai ai ${formatPrice(gold.remainingCents, "EUR")} în achiziții` : null,
                gold.remainingCourses !== null ? `${gold.remainingCourses} ${gold.remainingCourses === 1 ? "curs" : "cursuri"}` : null,
              ]
                .filter(Boolean)
                .join(" sau ")}
              {" "}până la Gold{gold.windowDays ? `, în ultimele ${gold.windowDays} de zile` : ""}.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Statusul Gold aduce reduceri și acces gratuit la activități selectate.</p>
        )}
      </section>

      <JourneyMap nodes={journey} />

      {next ? (
        <section aria-labelledby="next-title">
          <h2 id="next-title" className="font-display text-3xl">Următorul curs</h2>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-5 rounded-[2rem] border border-line bg-card p-7">
            <div>
              <p className="text-lg font-semibold">{next.title}</p>
              <p className="mt-1 text-sm text-muted">
                {formatDate(next.starts_at)}
                {next.location ? ` · ${next.location}` : ""}
              </p>
              <p className="mt-3 inline-block rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold">
                {daysUntil(next.starts_at!) <= 0 ? "Astăzi" : `În ${daysUntil(next.starts_at!)} ${daysUntil(next.starts_at!) === 1 ? "zi" : "zile"}`}
              </p>
            </div>
            <ButtonLink href={`/cont/cursuri/${next.slug}`}>Detalii curs</ButtonLink>
          </div>
        </section>
      ) : null}

      {courses.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">
          Nu ai încă cursuri achiziționate. <Link className="font-medium text-foreground underline underline-offset-4" href="/cursuri">Vezi catalogul</Link>
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <section aria-labelledby="rec-title">
          <h2 id="rec-title" className="font-display text-3xl">Recomandate pentru tine</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {suggestions.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
