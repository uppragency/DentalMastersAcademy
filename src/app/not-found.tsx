import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { ButtonLink, Container } from "@/components/ui";
import { getCourses } from "@/lib/data";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Pagina nu a fost găsită", robots: { index: false } };

export default async function NotFound() {
  let courses: Course[] = [];
  try {
    courses = (await getCourses({ limit: 3 })).slice(0, 3);
  } catch {
    courses = [];
  }
  const links = [
    { href: "/cursuri", label: "Cursuri" },
    { href: "/blog", label: "Blog" },
    { href: "/lectori", label: "Lectori" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <>
      <section className="grain relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
        <div aria-hidden="true" className="drift absolute -right-32 -top-40 -z-10 size-[480px] rounded-full bg-gold/20 blur-[110px]" />
        <Container className="py-16 sm:py-24 lg:py-32">
          <p className="rise font-display text-[7rem] font-medium leading-none text-gold-sheen sm:text-[11rem]">404</p>
          <h1 className="rise font-display mt-4 max-w-3xl text-balance text-4xl font-medium leading-[1.05] sm:text-6xl" style={{ ["--d" as string]: "100ms" }}>
            Pagina pe care o cauți nu există.
          </h1>
          <p className="rise mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60" style={{ ["--d" as string]: "200ms" }}>
            Linkul poate fi greșit sau pagina a fost mutată. Te ajutăm să ajungi unde ai nevoie.
          </p>
          <div className="rise mt-10 flex flex-wrap gap-3" style={{ ["--d" as string]: "300ms" }}>
            <ButtonLink href="/" variant="light">Înapoi acasă</ButtonLink>
            <ButtonLink href="/cursuri" variant="outline">Vezi cursurile</ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        <nav aria-label="Pagini utile" className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="underline-offset-4 transition-colors hover:text-gold hover:underline">{l.label}</a>
          ))}
        </nav>
        {courses.length > 0 ? (
          <section aria-labelledby="nf-courses" className="mt-12">
            <h2 id="nf-courses" className="font-display text-3xl">Poate te interesează</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (<li key={c.id}><CourseCard course={c} /></li>))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}
