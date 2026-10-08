import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import { CourseImage } from "@/components/course-image";
import { getCompletedLessonIds, getCurrentProfile, getMyEnrollments } from "@/lib/data";
import { formatDateRange, formatLabels, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Cursurile mele", robots: { index: false } };

const sourceLabel = { purchase: "Achiziționat", gold_free: "Acces Gold", admin: "Acordat" } as const;

export default async function MyCourses({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const profile = (await getCurrentProfile())!;
  const all = await getMyEnrollments(profile.id);
  const now = nowMs();
  const supabase = await createClient();
  const courseIds = all.map((e) => e.courses?.id).filter((x): x is string => Boolean(x));
  const [{ data: lessonRows }, doneIds] = await Promise.all([
    courseIds.length ? supabase.from("course_lessons").select("id, course_id").in("course_id", courseIds) : Promise.resolve({ data: [] as { id: string; course_id: string }[] }),
    getCompletedLessonIds(profile.id),
  ]);
  const done = new Set(doneIds);
  const progress = new Map<string, { total: number; done: number }>();
  for (const l of lessonRows ?? []) {
    const p = progress.get(l.course_id) ?? { total: 0, done: 0 };
    p.total++;
    if (done.has(l.id)) p.done++;
    progress.set(l.course_id, p);
  }

  const isOnline = (e: (typeof all)[number]) => e.courses!.format !== "physical";
  const valid = all.filter((e) => e.courses);
  const counts = {
    viitoare: valid.filter((e) => !isEnded(e.courses!, now)).length,
    online: valid.filter(isOnline).length,
    finalizate: valid.filter((e) => isEnded(e.courses!, now)).length,
  };
  const active = tab === "viitoare" || tab === "online" || tab === "finalizate" ? tab : "viitoare";
  const rows = valid.filter((e) => (active === "viitoare" ? !isEnded(e.courses!, now) : active === "online" ? isOnline(e) : isEnded(e.courses!, now)));

  const tabs = [
    { key: "viitoare", label: "Viitoare", n: counts.viitoare },
    { key: "online", label: "Online", n: counts.online },
    { key: "finalizate", label: "Finalizate", n: counts.finalizate },
  ];
  const empty = {
    viitoare: { title: "Nu ai cursuri viitoare", text: "Alege următorul curs din catalog și îți păstrăm locul în grup." },
    online: { title: "Nu ai cursuri online", text: "Cursurile online se urmăresc în ritmul tău, cu lecții și materiale." },
    finalizate: { title: "Niciun curs finalizat încă", text: "După curs, aici găsești adeverința, materialele și evaluarea." },
  }[active];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cursuri plătite</p>
      <h1 className="font-display mt-2 text-5xl font-medium">Cursurile mele</h1>
      <nav aria-label="Filtrare cursuri" className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/cont/cursuri?tab=${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
              active === t.key ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:text-foreground"
            }`}
          >
            {t.label} <span className="ml-1 opacity-60">{t.n}</span>
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
                    <CourseImage course={c} variant="thumb" sizes="(min-width: 1280px) 40vw, 100vw" className="size-full transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-ink">{sourceLabel[e.source]}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="font-display text-2xl leading-snug">{c.title}</h2>
                    <p className="mt-2 text-sm text-muted">{formatDateRange(c.starts_at, c.ends_at)} · {formatLabels[c.format]}</p>
                    {(() => {
                      const p = progress.get(c.id);
                      if (!p || p.total === 0) return null;
                      const pct = Math.round((p.done / p.total) * 100);
                      return (
                        <div className="mt-5">
                          <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progres curs">
                            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-muted">{p.done} din {p.total} lecții ({pct}%)</p>
                        </div>
                      );
                    })()}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold">Accesează cursul <Arrow className="group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8"><EmptyState title={empty.title} text={empty.text} href="/cursuri" cta="Vezi catalogul" /></div>
      )}
    </div>
  );
}
