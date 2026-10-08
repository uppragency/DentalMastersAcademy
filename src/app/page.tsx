import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { TestimonialsGrid } from "@/components/testimonials";
import { getCourses, getLoyaltySettings, getTestimonials } from "@/lib/data";

export default async function HomePage() {
  const [featured, testimonials, loyalty] = await Promise.all([
    getCourses({ featured: true, limit: 3 }),
    getTestimonials(3),
    getLoyaltySettings(),
  ]);
  const courses = featured.length > 0 ? featured : await getCourses({ limit: 3 });

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="py-24 text-center sm:py-32">
          <Eyebrow>Formare medicală avansată</Eyebrow>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Cursuri pentru medici stomatologi, la nivelul exigenței tale.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Programe susținute de formatori cu experiență clinică. Te înscrii și plătești direct în platformă, fără pași intermediari.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/cursuri">Vezi cursurile</ButtonLink>
            <ButtonLink href="/inregistrare" variant="ghost">Creează cont</ButtonLink>
          </div>
        </Container>
      </section>

      <section aria-labelledby="featured-title">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Recomandate</Eyebrow>
              <h2 id="featured-title" className="mt-3 text-3xl font-semibold tracking-tight">Cursuri cu înscrieri deschise</h2>
            </div>
            <ButtonLink href="/cursuri" variant="ghost" className="hidden sm:inline-flex">Toate cursurile</ButtonLink>
          </div>
          {courses.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <p className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center text-muted">
              Cursurile vor fi afișate aici imediat ce sunt publicate.
            </p>
          )}
        </Container>
      </section>

      {loyalty?.is_active ? (
        <section className="mt-24" aria-labelledby="gold-title">
          <Container>
            <div className="rounded-[2rem] bg-ink px-8 py-14 text-white sm:px-14">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b873]">Program Gold</p>
              <h2 id="gold-title" className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Cu cât înveți mai mult, cu atât câștigi mai mult.
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                Medicii cu istoric de participare devin automat clienți Gold: reducere de {Number(loyalty.gold_discount_percent)}% la cursurile viitoare și acces gratuit la activități selectate.
              </p>
              <ButtonLink href="/inregistrare" variant="gold" className="mt-8">Începe cu un cont gratuit</ButtonLink>
            </div>
          </Container>
        </section>
      ) : null}

        {testimonials.length > 0 ? (
          <section className="mt-24" aria-labelledby="testimonials-title">
            <Container>
              <Eyebrow>Testimoniale</Eyebrow>
              <h2 id="testimonials-title" className="mb-10 mt-3 text-3xl font-semibold tracking-tight">Ce spun medicii care au participat</h2>
              <TestimonialsGrid items={testimonials} />
            </Container>
          </section>
        ) : null}
    </>
  );
}
