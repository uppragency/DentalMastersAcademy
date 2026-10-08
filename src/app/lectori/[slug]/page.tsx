import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { TrainerAvatar } from "@/components/trainer-avatar";
import { getCourses, getTrainerBySlug } from "@/lib/data";
import { isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTrainerBySlug((await params).slug);
  return t ? { title: t.name, description: t.role ?? undefined } : {};
}

export default async function TrainerPage({ params }: Props) {
  const t = await getTrainerBySlug((await params).slug);
  if (!t) notFound();
  const all = await getCourses();
  const surname = t.name.replace("Dr. ", "").split(" ").slice(-1)[0]!;
  const courses = all.filter((c) => c.trainer_name?.includes(surname));
  const now = nowMs();
  return (
    <>
      <section className="grain relative isolate overflow-hidden bg-ink text-white">
        <Container className="py-20 sm:py-28">
          <nav aria-label="Breadcrumb" className="text-sm text-white/55"><Link href="/lectori" className="hover:text-white">Lectori</Link></nav>
          <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
            <TrainerAvatar name={t.name} photo={t.photo_url} size={140} />
            <div>
              <h1 className="font-display text-5xl font-medium leading-tight sm:text-6xl">{t.name}</h1>
              <p className="mt-4 max-w-2xl text-gold-bright/90">{t.role}</p>
            </div>
          </div>
        </Container>
      </section>
      <Container className="grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Eyebrow>Despre</Eyebrow>
          <p className="font-display mt-6 text-2xl leading-snug sm:text-3xl">{t.bio}</p>
        </div>
        <ul className="space-y-3 lg:col-span-4">
          {t.points.map((p) => (
            <li key={p} className="flex gap-3 border-t border-line pt-3 text-[15px] text-muted"><span className="mt-2.5 size-1 shrink-0 rotate-45 bg-gold" />{p}</li>
          ))}
        </ul>
      </Container>
      {courses.length > 0 ? (
        <section className="border-t border-line bg-card py-16">
          <Container>
            <h2 className="font-display text-4xl">Cursuri susținute</h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {courses.map((c) => <li key={c.id}><CourseCard course={c} ended={isEnded(c, now)} /></li>)}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
