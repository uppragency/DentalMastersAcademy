import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink, Container, SectionTitle, Arrow } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { CourseArt } from "@/components/course-art";
import { Counter } from "@/components/counter";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { getTestimonials } from "@/lib/data";
import { advantages, facility, modules, stats } from "@/content/site";
import { TrainerAvatar } from "@/components/trainer-avatar";
import { getTrainers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cine suntem",
  description: "Dental Masters Academy: un ecosistem de educație clinică care reunește sala de curs, radiologia, cabinetul și laboratorul dentar într-un singur loc.",
};

export default async function AboutPage() {
  const founders = (await getTrainers()).filter((t) => t.is_founder);
  const testimonials = await getTestimonials();
  return (
    <>
      <PageHero
        eyebrow="Cine suntem"
        title={<>Fluxul complet este <span className="text-gold-sheen">chiar aici.</span></>}
        lead="Pe o piață mondială a implantologiei în continuă evoluție, nevoia de educație structurată, aplicată și de înaltă calitate este mai mare ca oricând."
      />

      <section id="concept" className="scroll-mt-24 py-16 sm:py-24 lg:py-32">
        <Container className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionTitle eyebrow="Conceptul DMA" title="Un ecosistem de educație clinică, într-un singur loc." />
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted lg:col-span-6" delay={120}>
            <p>
              Dental Masters Academy reunește într-un singur spațiu sala de curs, radiologia, cabinetul stomatologic și laboratorul dentar.
            </p>
            <p>
              De la teorie și planificare digitală, la intervenții live și lucrări protetice, participanții urmăresc etapele tratamentului și legăturile dintre ele, de la primul examen până la restaurarea finală.
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

      <section className="py-16 sm:py-24 lg:py-32">
        <Container>
          <Reveal><SectionTitle eyebrow="Echipa" title="Lectori care practică zilnic ceea ce predau." /></Reveal>
          <ul className="mt-14 grid gap-6 lg:grid-cols-3">
            {founders.map((t) => (
              <Reveal as="li" key={t.id}>
                <Link href={`/lectori/${t.slug}`} className="flex h-full flex-col rounded-[2rem] border border-line bg-card p-8 transition-all duration-500 hover:-translate-y-1.5">
                  <TrainerAvatar name={t.name} photo={t.photo_url} size={96} />
                  <h3 className="font-display mt-6 text-2xl leading-tight">{t.name}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{t.role}</p>
                  <span className="mt-auto pt-6 text-sm font-medium text-gold">Profil și cazuri clinice</span>
                </Link>
              </Reveal>
            ))}
            <Reveal as="li">
              <Link href="/lectori" className="flex h-full flex-col justify-between rounded-[2rem] border border-line bg-card p-8 transition-all duration-500 hover:-translate-y-1.5">
                <div>
                  <h3 className="font-display text-2xl leading-tight">Lectorii noștri</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">Echipa de lectori care completează programul academiei.</p>
                </div>
                <span className="pt-6 text-sm font-medium text-gold">Vezi lectorii</span>
              </Link>
            </Reveal>
          </ul>
          <Reveal>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-ink p-8 text-white sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-2xl">Partenerii noștri</h3>
                <p className="mt-2 text-sm text-white/65">Companiile și laboratorul care susțin educația clinică din academie.</p>
              </div>
              <ButtonLink href="/parteneri" variant="outline">Vezi partenerii</ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-card py-16 sm:py-24 lg:py-32">
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
        <section className="py-16 sm:py-24 lg:py-32">
          <Container>
            <Reveal><SectionTitle eyebrow="Testimoniale" title="Ce spun participanții noștri." /></Reveal>
            <div className="mt-14"><TestimonialsCarousel items={testimonials} /></div>
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
