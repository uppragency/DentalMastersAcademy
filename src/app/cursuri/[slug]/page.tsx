import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings } from "@/lib/data";
import { formatDate, formatLabels, formatPrice } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return { title: course.title, description: course.summary ?? undefined };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  const enrolled = profile ? (await getEnrolledCourseIds(profile.id)).includes(course.id) : false;

  const isGold = profile?.tier === "gold" && loyalty?.is_active;
  const discount = isGold ? Number(loyalty!.gold_discount_percent) : 0;
  const finalPrice = Math.round(course.price_cents * (1 - discount / 100));
  const free = Boolean(isGold && course.gold_free);

  return (
    <Container className="py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
        <article>
          <Eyebrow>{course.categories?.name ?? "Curs"}</Eyebrow>
          <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{course.title}</h1>
          {course.summary ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{course.summary}</p> : null}

          {course.description ? (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">Descriere</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{course.description}</p>
            </section>
          ) : null}
          {course.syllabus ? (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">Programa</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{course.syllabus}</p>
            </section>
          ) : null}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-card p-7">
            <p className="text-sm text-muted">{enrolled ? "Status" : "Investiție"}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">
              {enrolled ? "Achiziționat" : free ? "Gratuit" : formatPrice(finalPrice, course.currency)}
            </p>
            {discount > 0 && !free && !enrolled ? (
              <p className="mt-1 text-sm text-muted">
                <span className="line-through">{formatPrice(course.price_cents, course.currency)}</span>
                <span className="ml-2 font-medium text-gold">Reducere Gold {discount}%</span>
              </p>
            ) : null}

            <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Data</dt><dd className="text-right font-medium">{formatDate(course.starts_at)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Format</dt><dd className="font-medium">{formatLabels[course.format]}</dd></div>
              {course.location ? <div className="flex justify-between gap-4"><dt className="text-muted">Locație</dt><dd className="text-right font-medium">{course.location}</dd></div> : null}
              {course.trainer_name ? <div className="flex justify-between gap-4"><dt className="text-muted">Formator</dt><dd className="text-right font-medium">{course.trainer_name}</dd></div> : null}
            </dl>

            {enrolled ? (
              <>
                <ButtonLink href={`/cont/cursuri/${course.slug}`} className="mt-7 w-full">Accesează cursul</ButtonLink>
                <p className="mt-3 text-center text-xs text-muted">Ai achiziționat deja acest curs.</p>
              </>
            ) : (
              <>
                <ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="gold" className="mt-7 w-full">
                  {free ? "Înscrie-te gratuit" : "Înscrie-te acum"}
                </ButtonLink>
                {!profile ? <p className="mt-3 text-center text-xs text-muted">Contul se creează la finalizarea comenzii.</p> : null}
              </>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
