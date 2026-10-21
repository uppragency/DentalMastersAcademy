import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
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

  const groups = [
    { key: "dma", title: "Cursurile DMA", lead: "Programele principale, susținute de Dr. Ovidiu Dumitru și Dr. Gabriel Mușețescu.", items: courses.filter((c) => c.kind !== "hosted") },
    { key: "hosted", title: "Cursuri găzduite", lead: "Cursuri susținute de invitați și parteneri, în spațiul Dental Masters Academy.", items: courses.filter((c) => c.kind === "hosted") },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title={<>Cursuri de <span className="text-gold-sheen">înaltă specializare.</span></>}
        lead="Cursuri DMA, cursuri găzduite și mentorat clinic. Înscrierea și plata se fac direct în platformă, cu cardul sau prin transfer bancar."
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
            <div className="mt-6 space-y-16">
              {groups.map((g) => (
                <div key={g.key} id={g.key} className="scroll-mt-28">
                  {groups.length > 1 || g.key === "hosted" ? (
                    <div className="mb-6">
                      <h2 className="font-display text-3xl font-medium tracking-tight">{g.title}</h2>
                      <p className="mt-2 max-w-2xl text-muted">{g.lead}</p>
                    </div>
                  ) : null}
                  <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((c, i) => (
                      <Reveal as="li" key={c.id} delay={(i % 3) * 90}><CourseCard course={c} ended={isEnded(c, now)} /></Reveal>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-3xl border border-dashed border-line p-14 text-center text-muted">Nu există cursuri pentru filtrele selectate.</p>
          )}

          <div className="mt-20 rounded-[2rem] bg-ink p-8 text-white sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">Mentorat clinic</p>
            <h2 className="font-display mt-3 max-w-2xl text-balance text-3xl font-medium sm:text-4xl">Vino cu propriul pacient în cabinetul DMA.</h2>
            <p className="mt-4 max-w-2xl text-white/65">Realizezi intervenția cu îndrumarea experților noștri sau asiști la intervenția efectuată de aceștia, în format over-the-shoulder.</p>
            <div className="mt-8"><ButtonLink href="/mentorat" variant="gold">Află cum funcționează</ButtonLink></div>
          </div>
        </Container>
      </section>
    </>
  );
}
