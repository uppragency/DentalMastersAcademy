import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { getCategories, getCourses } from "@/lib/data";
import { formatLabels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cursuri",
  description: "Catalogul de cursuri Dental Masters Academy pentru medici stomatologi.",
};

type Props = { searchParams: Promise<{ categorie?: string; format?: string }> };

function chip(active: boolean) {
  return `rounded-full border px-4 py-2 text-sm transition-colors ${
    active ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:text-foreground"
  }`;
}

export default async function CoursesPage({ searchParams }: Props) {
  const { categorie, format } = await searchParams;
  const [categories, courses] = await Promise.all([getCategories(), getCourses({ category: categorie, format })]);

  const href = (c?: string, f?: string) => {
    const params = new URLSearchParams();
    if (c) params.set("categorie", c);
    if (f) params.set("format", f);
    const qs = params.toString();
    return qs ? `/cursuri?${qs}` : "/cursuri";
  };

  return (
    <Container className="py-16">
      <Eyebrow>Catalog</Eyebrow>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Cursuri</h1>

      <div className="mt-10 space-y-4">
        <nav aria-label="Filtrare după specializare" className="flex flex-wrap gap-2">
          <Link href={href(undefined, format)} className={chip(!categorie)}>Toate specializările</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href(c.slug, format)} className={chip(categorie === c.slug)}>{c.name}</Link>
          ))}
        </nav>
        <nav aria-label="Filtrare după format" className="flex flex-wrap gap-2">
          <Link href={href(categorie)} className={chip(!format)}>Orice format</Link>
          {(Object.keys(formatLabels) as (keyof typeof formatLabels)[]).map((f) => (
            <Link key={f} href={href(categorie, f)} className={chip(format === f)}>{formatLabels[f]}</Link>
          ))}
        </nav>
      </div>

      {courses.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      ) : (
        <p className="mt-10 rounded-3xl border border-dashed border-line p-12 text-center text-muted">
          Nu există cursuri pentru filtrele selectate.
        </p>
      )}
    </Container>
  );
}
