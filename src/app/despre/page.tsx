import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink, Container, SectionTitle, Arrow } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { CourseArt } from "@/components/course-art";
import { Counter } from "@/components/counter";
import { TestimonialsGrid } from "@/components/testimonials";
import { getTestimonials } from "@/lib/data";
import { advantages, facility, modules, stats } from "@/content/site";
import { TrainerAvatar } from "@/components/trainer-avatar";
import { getTrainers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Despre noi",
  description: "Dental Masters Academy: Master Course in Implanto-Prosthetics, hands-on, chirurgie live și flux complet clinică, laborator.",
};

export default async function AboutPage() {
  const trainers = await getTrainers();
  const testimonials = await getTestimonials(3);
  return (
    <>
      <PageHero
        eyebrow="Despre noi"
        title={<>Fluxul complet este <span className="text-gold-sheen">chiar aici.</span></>}
        lead="Pe o piață mondială a implantologiei în continuă evoluție, nevoia de educație structurată, aplicată și de înaltă calitate este mai mare ca oricând."
      />

      <section className="py-24 sm:py-32">
        <Container className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionTitle eyebrow="Misiunea noastră" title="Masterul care te duce de la cazuri simple la reabilitări complexe." />
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted lg:col-span-6" delay={120}>
            <p>
              Master Course in Implant Surgery and Prosthetics este un program intensiv, structurat în cinci module progresive, conceput să ofere medicilor toate competențele necesare, de la cazuri simple până la reabilitări complexe All-on-X.
            </p>
            <p>
              Prin abordarea practică și accentul pe rezultate clinice predictibile, cursul aduce educație de nivel internațional în implanto-protetică.
            </p>
            <dl className="grid grid-cols-2 gap-6 pt-6">
              {stats.map((s) => (
                <div key={s.label} className="border-t border-line pt-4">
                  <dd className="font-display text-5xl text-foreground"><Counter value={s.value} suffix={s.suffix} /></dd>
                  <dt className="mt-1 text-sm">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      <section className="bg-ink py-24 text-white sm:py-32">
        <Container>
          <Reveal><SectionTitle light eyebrow="HQ Concept" title="Un spațiu proiectat pentru educație clinică." lead="Abordare digitală pentru planificarea cazurilor și modele realiste, color printate, cu tehnologie recentă dezvoltată pentru industria dentară." /></Reveal>
          <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {facility.map((f, i) => (
              <Reveal as="li" key={f.title} delay={i * 90}>
                <article className="relative h-full min-h-80 overflow-hidden rounded-[2rem] border border-white/10 p-7">
                  <CourseArt seed={`about-${i}`} className="absolute inset-0 size-full scale-150 opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end">
                    <h3 className="font-display text-2xl leading-snug">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{f.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
          <Reveal>
            <ul className="mt-16 grid gap-x-10 gap-y-4 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {advantages.map((a) => (
                <li key={a} className="flex gap-3 text-white/75"><span className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-gold-bright" />{a}</li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container>
          <Reveal><SectionTitle eyebrow="Experții noștri" title="Lectori care practică zilnic ceea ce predau." /></Reveal>
          <div className="mt-16 space-y-6">
            {trainers.map((t) => (
              <Reveal key={t.id}>
                <article className="grid gap-8 rounded-[2rem] border border-line bg-card p-8 sm:p-12 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <TrainerAvatar name={t.name} photo={t.photo_url} size={96} />
                    <h3 className="font-display mt-6 text-3xl leading-tight"><Link href={`/lectori/${t.slug}`} className="hover:text-gold">{t.name}</Link></h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{t.role}</p>
                  </div>
                  <div className="lg:col-span-8">
                    <p className="font-display text-2xl leading-snug sm:text-[1.7rem]">{t.bio}</p>
                    <ul className="mt-8 grid gap-3 sm:grid-cols-1">
                      {t.points.map((p) => (
                        <li key={p} className="flex gap-3 border-t border-line pt-3 text-[15px] text-muted"><span className="mt-2.5 size-1 shrink-0 rotate-45 bg-gold" />{p}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-card py-24 sm:py-32">
        <Container>
          <Reveal><SectionTitle eyebrow="Cele cinci module" title="Un parcurs construit pas cu pas." /></Reveal>
          <ol className="mt-14 divide-y divide-line border-y border-line">
            {modules.map((m) => (
              <Reveal as="li" key={m.n}>
                <div className="grid items-baseline gap-2 py-7 sm:grid-cols-12 sm:gap-6">
                  <span className="font-display text-4xl text-gold sm:col-span-1">{m.n}</span>
                  <h3 className="font-display text-2xl sm:col-span-5">{m.title}</h3>
                  <p className="text-muted sm:col-span-4">{m.text}</p>
                  <p className="text-sm font-semibold text-foreground sm:col-span-2 sm:text-right">{m.when}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {testimonials.length > 0 ? (
        <section className="py-24 sm:py-32">
          <Container>
            <Reveal><SectionTitle eyebrow="Testimoniale" title="Ce spun participanții noștri." /></Reveal>
            <div className="mt-14"><TestimonialsGrid items={testimonials} /></div>
          </Container>
        </section>
      ) : null}

      <section className="grain relative overflow-hidden bg-ink py-24 text-center text-white">
        <Container>
          <Reveal>
            <h2 className="font-display mx-auto max-w-3xl text-balance text-5xl font-medium">Pregătit pentru următorul nivel?</h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/cursuri" variant="gold">Vezi cursurile <Arrow /></ButtonLink>
              <ButtonLink href="/contact" variant="outline">Contact</ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
