import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getCategories, getCourses } from "@/lib/data";
import { isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: cat.name, description: `Cursuri de ${cat.name} la Dental Masters Academy.` } : {};
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const courses = await getCourses({ category: slug });
  const now = nowMs();

  return (
    <>
      <PageHero eyebrow="Categorie" title={cat.name} lead={`${courses.length} ${courses.length === 1 ? "curs disponibil" : "cursuri disponibile"} în această specializare.`}>
        <Link href="/categorii" className="text-sm text-white/60 transition-colors hover:text-white">← Toate categoriile</Link>
      </PageHero>
      <section className="py-16 sm:py-24">
        <Container>
          {courses.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((c, i) => (
                <Reveal as="li" key={c.id} delay={(i % 3) * 90}><CourseCard course={c} ended={isEnded(c, now)} /></Reveal>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-dashed border-line p-14 text-center text-muted">Momentan nu există cursuri în această categorie.</p>
          )}
        </Container>
      </section>
    </>
  );
}
