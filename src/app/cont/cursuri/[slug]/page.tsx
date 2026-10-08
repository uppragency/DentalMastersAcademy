import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setLessonDone } from "@/actions/learning";
import { Button, ButtonLink } from "@/components/ui";
import { CourseArt } from "@/components/course-art";
import { VideoPlayer } from "@/components/video-player";
import { createClient } from "@/lib/supabase/server";
import { getCompletedLessonIds, getCurrentProfile, getLessons } from "@/lib/data";
import { formatDateRange, formatLabels } from "@/lib/format";
import { parseVideo } from "@/lib/video";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Cursul meu", robots: { index: false } };

export default async function MyCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lectia?: string }>;
}) {
  const { slug } = await params;
  const { lectia } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/autentificare?next=/cont/cursuri/${slug}`);

  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle<Course>();
  if (!course) notFound();

  // RLS: a student only sees their own enrollments
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enrollment) redirect(`/cursuri/${slug}`);

  const [lessons, doneIds] = await Promise.all([getLessons(course.id), getCompletedLessonIds(profile.id)]);
  const done = new Set(doneIds);
  const current = lessons.find((l) => l.id === lectia) ?? lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const currentIdx = current ? lessons.findIndex((l) => l.id === current.id) : -1;
  const next = currentIdx >= 0 ? lessons[currentIdx + 1] : undefined;
  const completed = lessons.filter((l) => done.has(l.id)).length;
  const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  const source = parseVideo(current?.video_url ?? null);

  return (
    <div>
      <Link href="/cont/cursuri" className="text-sm text-muted transition-colors hover:text-foreground">← Cursurile mele</Link>

      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-ink shadow-[0_40px_80px_-40px_rgba(8,13,23,.6)]">
            {source ? (
              <VideoPlayer source={source} title={current?.title ?? course.title} />
            ) : (
              <>
                <CourseArt seed={course.slug} className="absolute inset-0 size-full scale-110 opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-white sm:p-12">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-bright">
                    {lessons.length === 0 ? "Materiale în pregătire" : "Lecție fără video"}
                  </p>
                  <p className="font-display mt-3 max-w-xl text-2xl leading-snug sm:text-4xl">
                    {lessons.length === 0 ? "Materialele video și suportul de curs vor apărea aici." : current?.title}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{course.title}</p>
              <h1 className="font-display mt-2 text-balance text-4xl font-medium leading-tight sm:text-5xl">{current?.title ?? course.title}</h1>
            </div>
            {current ? (
              <div className="flex flex-wrap gap-2">
                <form action={setLessonDone.bind(null, current.id, slug, !done.has(current.id))}>
                  <Button type="submit" variant={done.has(current.id) ? "ghost" : "gold"}>
                    {done.has(current.id) ? "Marcată ca terminată" : "Marchează ca terminată"}
                  </Button>
                </form>
                {next ? <ButtonLink href={`/cont/cursuri/${slug}?lectia=${next.id}`} variant="primary">Următoarea lecție</ButtonLink> : null}
              </div>
            ) : null}
          </div>
          {current?.description ? <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">{current.description}</p> : null}

          <dl className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Data", formatDateRange(course.starts_at, course.ends_at)],
              ["Format", formatLabels[course.format]],
              ["Locație", course.location ?? "Se anunță"],
              ["Limba", course.language ?? "Română"],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-6"><dt className="text-muted">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
            ))}
          </dl>
          {course.starts_at ? (
            <p className="mt-4">
              <a href={`/cont/cursuri/${slug}/calendar.ics`} className="text-sm font-medium text-gold underline underline-offset-4">Adaugă în calendar</a>
            </p>
          ) : null}

          {course.sections.length > 0 ? (
            <section className="mt-14" aria-labelledby="prog">
              <h2 id="prog" className="font-display text-3xl">Programa</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {course.sections.map((s, i) => (
                  <article key={s.title} className="rounded-3xl border border-line bg-card p-6">
                    <p className="font-display text-gold">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 font-semibold leading-snug">{s.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      {s.items.map((it) => <li key={it} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rotate-45 bg-gold" />{it}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start" aria-label="Lecții">
          <div className="rounded-[2rem] border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Lecții</h2>
              <span className="text-sm text-muted">{completed}/{lessons.length}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progres curs">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
            {lessons.length > 0 ? (
              <ol className="mt-5 space-y-1">
                {lessons.map((l, i) => {
                  const isCurrent = l.id === current?.id;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/cont/cursuri/${slug}?lectia=${l.id}`}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors ${isCurrent ? "bg-ink text-white" : "hover:bg-background"}`}
                      >
                        <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done.has(l.id) ? "bg-gold text-white" : isCurrent ? "bg-white/15" : "bg-line text-muted"}`}>
                          {done.has(l.id) ? "✓" : i + 1}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                        {l.duration_min ? <span className={`shrink-0 text-xs ${isCurrent ? "text-white/60" : "text-muted"}`}>{l.duration_min} min</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-muted">Lecțiile și materialele vor fi adăugate aici. Vei primi o notificare când sunt disponibile.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
