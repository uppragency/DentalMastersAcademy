import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { PageHero } from "@/components/page-hero";
import { CourseFilters } from "@/components/course-filters";
import { Reveal } from "@/components/reveal";
import { getCategories, getCourses } from "@/lib/data";
import { isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = {
  title: "Cursuri",
  description: "Catalogul de cursuri Dental Masters Academy pentru medici stomatologi.",
};

type Props = { searchParams: Promise<{ categorie?: string; format?: string; perioada?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const { categorie, format, perioada } = await searchParams;
  const [categories, all] = await Promise.all([getCategories(), getCourses({ category: categorie, format })]);
  const now = nowMs();
  const when = perioada === "viitoare" || perioada === "incheiate" ? perioada : "";
  const courses = all.filter((c) => (when === "viitoare" ? !isEnded(c, now) : when === "incheiate" ? isEnded(c, now) : true));

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title={<>Cursuri de <span className="text-gold-sheen">înaltă specializare.</span></>}
        lead="Programe hands-on și clinice pentru implantologie, chirurgie, parodontologie și protetică. Înscrierea și plata se fac direct în platformă."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <CourseFilters
            categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            categorie={categorie}
            format={format}
            perioada={when}
            upcoming={all.filter((c) => !isEnded(c, now)).map((c) => ({ id: c.id, slug: c.slug, title: c.title, starts_at: c.starts_at }))}
          />

          <p className="mt-10 text-sm text-muted" aria-live="polite">{courses.length} {courses.length === 1 ? "curs" : "cursuri"}</p>
          {courses.length > 0 ? (
            <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((c, i) => (
                <Reveal as="li" key={c.id} delay={(i % 3) * 90}><CourseCard course={c} ended={isEnded(c, now)} /></Reveal>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-3xl border border-dashed border-line p-14 text-center text-muted">Nu există cursuri pentru filtrele selectate.</p>
          )}
        </Container>
      </section>
    </>
  );
}
