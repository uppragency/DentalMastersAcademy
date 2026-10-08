import type { Metadata } from "next";
import Link from "next/link";
import { Container, Arrow } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { CourseArt } from "@/components/course-art";
import { Reveal } from "@/components/reveal";
import { getCategories, getCategoryCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Categorii", description: "Cursurile Dental Masters Academy, grupate pe specializări." };

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);
  return (
    <>
      <PageHero eyebrow="Specializări" title={<>Explorează după <span className="text-gold-sheen">domeniu.</span></>} lead="Alege specializarea care te interesează și vezi toate cursurile disponibile." />
      <section className="py-16 sm:py-24">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal as="li" key={c.id} delay={(i % 3) * 90}>
                <Link href={`/categorii/${c.slug}`} className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-ink p-8 text-white">
                  <CourseArt seed={`cat-${c.slug}`} className="absolute inset-0 size-full scale-110 opacity-70 transition-all duration-700 group-hover:scale-125 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <div className="relative flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">{counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "curs" : "cursuri"}</p>
                      <h2 className="font-display mt-2 text-3xl leading-tight">{c.name}</h2>
                    </div>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-colors group-hover:bg-gold-bright"><Arrow /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
