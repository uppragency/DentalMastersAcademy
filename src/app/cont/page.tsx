import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { getCourses, getCurrentProfile, getLoyaltyState, getLoyaltySettings, getMyEnrollments, getMyOrders, getUnreadCount } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatPrice } from "@/lib/format";
import { tierPerks } from "@/lib/loyalty";
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
  const [enrollments, loyalty, orders, unread] = await Promise.all([getMyEnrollments(profile.id), getLoyaltySettings(), getMyOrders(profile.id), getUnreadCount(profile.id)]);
  const paidOrders = orders.filter((o) => o.status === "paid");
  const gold = await getLoyaltyState(profile.id, loyalty);
  const perk = tierPerks(profile.tier, loyalty);
  const isGold = profile.tier !== "standard";
  const firstName = (profile.full_name ?? "").split(" ")[0];

  const courses = enrollments.map((e) => e.courses).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const upcoming = courses
    .filter((c) => c.starts_at && new Date(c.starts_at).getTime() >= nowMs())
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
  const next = upcoming[0];
  const owned = new Set(courses.map((c) => c.id));
  const allCourses = await getCourses();
  const spec = (profile.specialization ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const relevance = (c: { title: string; summary: string | null; categories?: { name: string } | null }) => {
    const hay = `${c.title} ${c.summary ?? ""} ${c.categories?.name ?? ""}`.toLowerCase();
    return spec.filter((w) => hay.includes(w)).length;
  };
  const suggestions = allCourses
    .filter((c) => !owned.has(c.id) && !isEnded(c, nowMs()))
    .sort((a, b) => relevance(b) - relevance(a))
    .slice(0, 2);
  const attendedIds = new Set(enrollments.filter((e) => e.attended).map((e) => e.courses?.id));
  const journey: JourneyNode[] = allCourses.map((c) => ({
    course: c,
    state: owned.has(c.id) ? (attendedIds.has(c.id) || isEnded(c, nowMs()) ? "done" : "booked") : "open",
  }));

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
        <div className="mt-5"><Badges courses={courses.length} gold={isGold} platinum={profile.tier === "platinum"} /></div>
      </header>

      {gold.expiringSoon > 0 ? (
        <p role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-soft px-5 py-4 text-sm">
          <span>{gold.expiringSoon} puncte expiră {gold.expiringAt ? `până la ${formatDate(gold.expiringAt)}` : "în curând"}. Le poți folosi la următoarea achiziție.</span>
          <Link href="/cursuri" className="font-semibold underline underline-offset-4">Vezi cursurile</Link>
        </p>
      ) : null}

      <section aria-label="Pe scurt" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[2rem] bg-ink p-7 text-white sm:col-span-2">
          <p className="text-sm text-white/60">Următorul curs</p>
          {next ? (
            <>
              <p className="font-display mt-3 text-3xl leading-snug">{next.title}</p>
              <p className="mt-2 text-sm text-white/60">{formatDate(next.starts_at)}{next.location ? ` · ${next.location}` : ""}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gold-bright px-3.5 py-1.5 text-xs font-bold text-ink">
                  {daysUntil(next.starts_at!) <= 0 ? "Astăzi" : `În ${daysUntil(next.starts_at!)} ${daysUntil(next.starts_at!) === 1 ? "zi" : "zile"}`}
                </span>
                <Link href={`/cont/cursuri/${next.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-ink">Detalii curs</Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-display mt-3 text-3xl leading-snug">Niciun curs programat</p>
              <p className="mt-2 text-sm text-white/60">Alege următorul pas din catalog.</p>
              <Link href="/cursuri" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-ink">Vezi cursurile</Link>
            </>
          )}
        </div>
        <Link href="/cont/program" className="rounded-[2rem] border border-line bg-card p-7 transition-colors hover:bg-background">
          <p className="text-sm text-muted">Puncte disponibile</p>
          <p className="font-display mt-3 text-5xl">{gold.balance}</p>
          <p className="mt-2 text-sm text-muted">{formatPrice(Math.round(gold.balance * Number(loyalty?.point_value_cents ?? 5)), "EUR")} la următoarea achiziție</p>
        </Link>
        <Link href="/cont/comenzi" className="rounded-[2rem] border border-line bg-card p-7 transition-colors hover:bg-background">
          <p className="text-sm text-muted">Comenzi plătite</p>
          <p className="font-display mt-3 text-5xl">{paidOrders.length}</p>
          <p className="mt-2 text-sm text-muted">{formatPrice(gold.spentCents, "EUR")} investit în ultimul an</p>
        </Link>
        <Link href="/cont/cursuri" className="rounded-[2rem] border border-line bg-card p-7 transition-colors hover:bg-background">
          <p className="text-sm text-muted">Cursuri</p>
          <p className="font-display mt-3 text-5xl">{courses.length}</p>
          <p className="mt-2 text-sm text-muted">{upcoming.length} viitoare</p>
        </Link>
        <Link href="/cont/notificari" className="rounded-[2rem] border border-line bg-card p-7 transition-colors hover:bg-background">
          <p className="text-sm text-muted">Notificări necitite</p>
          <p className="font-display mt-3 text-5xl">{unread}</p>
          <p className="mt-2 text-sm text-muted">{unread > 0 ? "Deschide notificările" : "Totul la zi"}</p>
        </Link>
      </section>

      <section aria-labelledby="gold-title" className={`rounded-[2rem] p-8 sm:p-10 ${isGold ? "bg-gradient-to-br from-[#14100a] to-[#2e220d] text-white" : "border border-line bg-card"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isGold ? "text-[#d9b873]" : "text-gold"}`}>Program Gold</p>
        <h2 id="gold-title" className="mt-2 font-display text-3xl">
          {isGold ? `Ești membru ${perk.name}` : "Drumul tău spre Gold"}
        </h2>
        <p className={`mt-2 max-w-xl text-sm leading-relaxed ${isGold ? "text-white/70" : "text-muted"}`}>
          {isGold
            ? `Ai reducere ${perk.discountPercent}% la cursuri, ${perk.multiplier}x puncte la fiecare achiziție și acces gratuit la activitățile marcate Gold.`
            : "Statusul Gold aduce reduceri, puncte în plus și acces gratuit la activități selectate."}
        </p>
        <Link href="/cont/program" className={`mt-5 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium ${isGold ? "bg-white text-ink" : "bg-ink text-white"}`}>Vezi programul și punctele</Link>
      </section>

      <JourneyMap nodes={journey} />

      {courses.length === 0 ? (
        <EmptyState title="Nu ai încă cursuri" text="După prima înscriere, cursurile, programul și materialele apar aici." href="/cursuri" cta="Vezi catalogul" />
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
