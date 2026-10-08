import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getCategories, getCourses } from "@/lib/data";
import { formatLabels, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = {
  title: "Cursuri",
  description: "Catalogul de cursuri Dental Masters Academy pentru medici stomatologi.",
};

type Props = { searchParams: Promise<{ categorie?: string; format?: string; perioada?: string }> };

function chip(active: boolean) {
  return `rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${
    active ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:border-foreground/30 hover:text-foreground"
  }`;
}

export default async function CoursesPage({ searchParams }: Props) {
  const { categorie, format, perioada } = await searchParams;
  const [categories, all] = await Promise.all([getCategories(), getCourses({ category: categorie, format })]);
  const now = nowMs();
  const when = perioada === "viitoare" || perioada === "incheiate" ? perioada : "";
  const courses = all.filter((c) => (when === "viitoare" ? !isEnded(c, now) : when === "incheiate" ? isEnded(c, now) : true));

  const href = (o: { c?: string; f?: string; p?: string }) => {
    const params = new URLSearchParams();
    if (o.c) params.set("categorie", o.c);
    if (o.f) params.set("format", o.f);
    if (o.p) params.set("perioada", o.p);
    const qs = params.toString();
    return qs ? `/cursuri?${qs}` : "/cursuri";
  };
  const cur = { c: categorie, f: format, p: when };

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title={<>Cursuri de <span className="text-gold-sheen">înaltă specializare.</span></>}
        lead="Programe hands-on și clinice pentru implantologie, chirurgie, parodontologie și protetică. Înscrierea și plata se fac direct în platformă."
      />
      <section className="py-14 sm:py-20">
        <Container>
          <div className="space-y-4">
            <nav aria-label="Filtrare după specializare" className="flex flex-wrap gap-2">
              <Link href={href({ ...cur, c: undefined })} className={chip(!categorie)}>Toate specializările</Link>
              {categories.map((c) => (
                <Link key={c.id} href={href({ ...cur, c: c.slug })} className={chip(categorie === c.slug)}>{c.name}</Link>
              ))}
            </nav>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <nav aria-label="Filtrare după perioadă" className="flex flex-wrap gap-2">
                <Link href={href({ ...cur, p: undefined })} className={chip(!when)}>Toate</Link>
                <Link href={href({ ...cur, p: "viitoare" })} className={chip(when === "viitoare")}>Înscrieri deschise</Link>
                <Link href={href({ ...cur, p: "incheiate" })} className={chip(when === "incheiate")}>Ediții încheiate</Link>
              </nav>
              <nav aria-label="Filtrare după format" className="flex flex-wrap gap-2">
                <Link href={href({ ...cur, f: undefined })} className={chip(!format)}>Orice format</Link>
                {(Object.keys(formatLabels) as (keyof typeof formatLabels)[]).map((f) => (
                  <Link key={f} href={href({ ...cur, f })} className={chip(format === f)}>{formatLabels[f]}</Link>
                ))}
              </nav>
            </div>
          </div>

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
