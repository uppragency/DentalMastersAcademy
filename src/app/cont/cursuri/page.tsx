import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Arrow } from "@/components/ui";
import { CourseArt } from "@/components/course-art";
import { getCurrentProfile, getMyEnrollments } from "@/lib/data";
import { formatDateRange, formatLabels, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Cursurile mele", robots: { index: false } };

const sourceLabel = { purchase: "Achiziționat", gold_free: "Acces Gold", admin: "Acordat" } as const;

export default async function MyCourses({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const profile = (await getCurrentProfile())!;
  const all = await getMyEnrollments(profile.id);
  const now = nowMs();

  const active = tab === "viitoare" || tab === "incheiate" ? tab : "toate";
  const rows = all.filter((e) => {
    if (!e.courses) return false;
    if (active === "viitoare") return !isEnded(e.courses, now);
    if (active === "incheiate") return isEnded(e.courses, now);
    return true;
  });

  const tabs = [
    { key: "toate", label: "Toate" },
    { key: "viitoare", label: "Viitoare" },
    { key: "incheiate", label: "Încheiate" },
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cursuri plătite</p>
      <h1 className="font-display mt-2 text-5xl font-medium">Cursurile mele</h1>
      <nav aria-label="Filtrare cursuri" className="mt-8 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "toate" ? "/cont/cursuri" : `/cont/cursuri?tab=${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
              active === t.key ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length > 0 ? (
        <ul className="mt-8 grid gap-5 xl:grid-cols-2">
          {rows.map((e) => {
            const c = e.courses!;
            return (
              <li key={e.id}>
                <Link href={`/cont/cursuri/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(8,13,23,.4)]">
                  <div className="relative aspect-[16/7] bg-ink">
                    <CourseArt seed={c.slug} className="size-full transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-ink">{sourceLabel[e.source]}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="font-display text-2xl leading-snug">{c.title}</h2>
                    <p className="mt-2 text-sm text-muted">{formatDateRange(c.starts_at, c.ends_at)} · {formatLabels[c.format]}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold">Accesează cursul <Arrow className="group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-dashed border-line p-14 text-center">
          <p className="text-muted">Nu există cursuri în această listă.</p>
          <ButtonLink href="/cursuri" variant="ghost" className="mt-6">Vezi catalogul</ButtonLink>
        </div>
      )}
    </div>
  );
}
