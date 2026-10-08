import Link from "next/link";
import { ButtonLink, Container, Eyebrow, SectionTitle, Arrow } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { CourseArt } from "@/components/course-art";
import { TestimonialsGrid } from "@/components/testimonials";
import { Faq } from "@/components/faq";
import { Reveal } from "@/components/reveal";
import { Counter } from "@/components/counter";
import { getCategories, getCategoryCounts, getCourses, getLoyaltySettings, getTestimonials, getTrainers } from "@/lib/data";
import { dayNum, formatPrice, isEnded, monthShort } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { advantages, facility, heroVideoUrl, howItWorks, modules, stats, topics } from "@/content/site";
import { getFaqs, getPartners } from "@/lib/site-content";
import { LocationMap } from "@/components/location-map";
import { TrainerAvatar } from "@/components/trainer-avatar";

export default async function HomePage() {
  const [trainers, courses, testimonials, loyalty, categories, counts, faqs, partners] = await Promise.all([
    getTrainers(),
    getCourses(),
    getTestimonials(),
    getLoyaltySettings(),
    getCategories(),
    getCategoryCounts(),
    getFaqs(),
    getPartners(),
  ]);
  const now = nowMs();
  const upcoming = courses.filter((c) => !isEnded(c, now));
  const next = upcoming[0] ?? courses[courses.length - 1];

  return (
    <>
      {/* HERO */}
      <section className="grain relative isolate overflow-hidden bg-ink text-white">
        {heroVideoUrl ? (
          <>
            <video aria-hidden="true" src={heroVideoUrl} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 -z-20 size-full object-cover opacity-40" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/40" />
          </>
        ) : null}
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
        <div aria-hidden="true" className="drift absolute -right-40 -top-40 -z-10 size-[640px] rounded-full bg-gold/25 blur-[120px]" />
        <div aria-hidden="true" className="drift absolute -bottom-52 -left-40 -z-10 size-[560px] rounded-full bg-[#1c3a5e]/60 blur-[120px]" style={{ animationDelay: "-6s" }} />
        <Container className="grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-12 lg:py-36">
          <div className="lg:col-span-7">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-white/80" style={{ ["--d" as string]: "0ms" }}>
              <span className="size-1.5 rounded-full bg-gold-bright" /> Master Course in Implanto-Prosthetics · București
            </p>
            <h1 className="rise font-display mt-8 text-balance text-5xl font-medium leading-[0.98] sm:text-7xl lg:text-[5.5rem]" style={{ ["--d" as string]: "120ms" }}>
              Fluxul complet al implantologiei,{" "}
              <span className="text-gold-sheen">într-un singur loc.</span>
            </h1>
            <p className="rise mt-8 max-w-xl text-pretty text-lg leading-relaxed text-white/65" style={{ ["--d" as string]: "260ms" }}>
              Cursuri hands-on, chirurgie live și planificare digitală, de la cazuri simple la reabilitări All-on-X. Grupe de maximum 20 de participanți, lectori cu peste 15 ani de practică.
            </p>
            <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "380ms" }}>
              <ButtonLink href="/cursuri" variant="light">Explorează cursurile <Arrow /></ButtonLink>
              <ButtonLink href="/despre" variant="outline">Despre academie</ButtonLink>
            </div>
          </div>

          <div className="rise relative lg:col-span-5" style={{ ["--d" as string]: "300ms" }}>
            <div className="float relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/15 shadow-[0_50px_100px_-30px_rgba(0,0,0,.8)]" style={{ ["--r" as string]: "2deg" }}>
              <CourseArt seed={next?.slug ?? "dma"} className="size-full scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            </div>
            {next ? (
              <Link
                href={`/cursuri/${next.slug}`}
                className="glass float absolute -bottom-6 -left-2 right-6 rounded-3xl p-5 transition-colors hover:bg-white/10 sm:-left-8 sm:right-auto sm:w-80"
                style={{ ["--r" as string]: "-1deg", animationDelay: "-3s" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-bright">
                  {isEnded(next, now) ? "Ultima ediție" : "Următorul curs"}
                </span>
                <span className="font-display mt-2 block text-xl leading-snug">{next.title}</span>
                <span className="mt-3 flex items-center justify-between text-sm text-white/70">
                  <span>{dayNum(next.starts_at)} {monthShort(next.starts_at)} · București</span>
                  <span className="font-semibold text-white">{formatPrice(next.price_cents, next.currency)}</span>
                </span>
              </Link>
            ) : null}
          </div>
        </Container>

        <div className="border-t border-white/10">
          <Container>
            <dl className="grid grid-cols-2 divide-white/10 py-2 lg:grid-cols-4 lg:divide-x">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-2 py-8 lg:px-8 ${i === 0 ? "lg:pl-0" : ""}`}>
                  <dd className="font-display text-5xl font-medium text-white sm:text-6xl"><Counter value={s.value} suffix={s.suffix} /></dd>
                  <dt className="mt-2 max-w-[14rem] text-sm text-white/50">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Container>
        </div>
      </section>

      {/* MARQUEE */}
      <section aria-hidden="true" className="overflow-hidden border-b border-line bg-card py-6">
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {[...topics, ...topics].map((t, i) => (
            <span key={i} className="font-display flex items-center gap-12 text-3xl text-foreground/80">
              {t}
              <span className="size-2 rotate-45 bg-gold" />
            </span>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section className="py-16 sm:py-24 lg:py-32" aria-labelledby="courses-title">
        <Container>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <Reveal>
              <div id="courses-title">
                <SectionTitle eyebrow="Cursuri 2026" title={<>Alege modulul <em className="text-gold">potrivit etapei tale.</em></>} />
              </div>
            </Reveal>
            <Reveal delay={100}><ButtonLink href="/cursuri" variant="ghost">Toate cursurile <Arrow /></ButtonLink></Reveal>
          </div>
          {courses.length > 0 ? (
            <ul className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {courses.map((c, i) => (
                <Reveal as="li" key={c.id} delay={i * 90}><CourseCard course={c} ended={isEnded(c, now)} /></Reveal>
              ))}
            </ul>
          ) : (
            <p className="mt-12 rounded-3xl border border-dashed border-line p-10 text-center text-muted">Cursurile vor fi afișate aici imediat ce sunt publicate.</p>
          )}
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="pb-16 sm:pb-24 lg:pb-32" aria-labelledby="how-title">
        <Container>
          <Reveal><div id="how-title"><SectionTitle eyebrow="Cum funcționează" title="De la alegere la certificare, în trei pași." /></div></Reveal>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {howItWorks.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 100}>
                <div className="h-full rounded-[2rem] border border-line bg-card p-8">
                  <span className="font-display text-5xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display mt-6 text-2xl">{st.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{st.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 ? (
        <section className="pb-16 sm:pb-24 lg:pb-32" aria-labelledby="cats-title">
          <Container>
            <Reveal><h2 id="cats-title" className="sr-only">Categorii</h2></Reveal>
            <ul className="grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id} className="bg-card">
                  <Link href={`/categorii/${c.slug}`} className="group flex min-h-32 items-center justify-between gap-4 p-8 transition-colors hover:bg-gold-soft">
                    <span>
                      <span className="font-display block text-2xl">{c.name}</span>
                      <span className="mt-1 block text-sm text-muted">{counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "curs" : "cursuri"}</span>
                    </span>
                    <span className="flex size-11 items-center justify-center rounded-full border border-line transition-all group-hover:border-ink group-hover:bg-ink group-hover:text-white">
                      <Arrow className="group-hover:translate-x-0" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* MASTER COURSE */}
      <section className="grain relative overflow-hidden bg-ink-2 py-24 text-white sm:py-32" aria-labelledby="master-title">
        <div aria-hidden="true" className="drift absolute -left-40 top-20 size-[520px] rounded-full bg-gold/15 blur-[120px]" />
        <Container className="relative">
          <Reveal>
            <div id="master-title">
              <SectionTitle light eyebrow="Master Course" title={<>Cinci module progresive, de la cazuri simple la <span className="text-gold-sheen">All-on-X.</span></>}
                lead="Un program intensiv în care construiești pas cu pas competențele chirurgicale și protetice necesare, cu accent pe rezultate clinice predictibile." />
            </div>
          </Reveal>
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 lg:grid-cols-5">
            {modules.map((m, i) => (
              <Reveal as="li" key={m.n} delay={i * 80} className="bg-ink-2">
                <div className="group flex h-full flex-col p-8 transition-colors hover:bg-white/[0.04]">
                  <span className="font-display text-6xl text-gold-bright/40 transition-colors group-hover:text-gold-bright">{m.n}</span>
                  <h3 className="font-display mt-8 text-xl leading-snug">{m.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{m.text}</p>
                  <p className="mt-auto pt-8 text-xs font-semibold uppercase tracking-widest text-gold-bright">{m.when}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* HQ CONCEPT */}
      <section className="py-16 sm:py-24 lg:py-32" aria-labelledby="hq-title">
        <Container>
          <div className="grid gap-16 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <div id="hq-title">
                <SectionTitle eyebrow="HQ Concept" title={<>Un spațiu creat pentru educație clinică.</>}
                  lead="Abordare digitală pentru planificarea cazurilor și modele realiste, color printate, cu tehnologie recentă. Acoperim atât partea de laborator tehnic, cât și partea clinică a procedurii implanto-protetice." />
              </div>
              <ul className="mt-10 space-y-4">
                {advantages.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-[15px]">
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8" /><path d="M6.500 10.200l2.400 2.400 4.600-5" /></svg>
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
              {facility.map((f, i) => (
                <Reveal key={f.title} delay={i * 90} className={i % 3 === 0 ? "sm:row-span-1" : ""}>
                  <article className={`group relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-[2rem] p-8 ${i === 0 || i === 3 ? "bg-ink text-white" : "border border-line bg-card"}`}>
                    <div aria-hidden="true" className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-70">
                      {i === 0 || i === 3 ? <CourseArt seed={`fac-${i}`} className="size-full scale-150" /> : null}
                    </div>
                    <span className="relative font-display text-5xl text-gold/80">0{i + 1}</span>
                    <h3 className="font-display relative mt-4 text-2xl leading-snug">{f.title}</h3>
                    <p className={`relative mt-3 text-sm leading-relaxed ${i === 0 || i === 3 ? "text-white/70" : "text-muted"}`}>{f.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* TRAINERS */}
      <section className="bg-ink py-24 text-white sm:py-32" aria-labelledby="exp-title">
        <Container>
          <Reveal>
            <div id="exp-title"><SectionTitle light eyebrow="Experții noștri" title="Învață de la clinicieni care practică zilnic." /></div>
          </Reveal>
          <ul className="mt-16 grid gap-5 lg:grid-cols-3">
            {trainers.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 100}>
                <article className="group flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-gold-bright/40 hover:bg-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <TrainerAvatar name={t.name} photo={t.photo_url} size={64} />
                    <h3 className="font-display text-2xl leading-tight"><Link href={`/lectori/${t.slug}`} className="hover:text-gold-bright">{t.name}</Link></h3>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-gold-bright/90">{t.role}</p>
                  <p className="mt-5 text-[15px] leading-relaxed text-white/60">{t.bio}</p>
                  <ul className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm text-white/75">
                    {t.points.map((p) => (
                      <li key={p} className="flex gap-3"><span className="mt-2 size-1 shrink-0 rotate-45 bg-gold-bright" />{p}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* GOLD */}
      {loyalty?.is_active ? (
        <section className="py-16 sm:py-24 lg:py-32" aria-labelledby="gold-title">
          <Container>
            <Reveal>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#14100a] via-[#2a1f0c] to-[#14100a] p-10 text-white sm:p-16 lg:p-20">
                <div aria-hidden="true" className="drift absolute -right-24 -top-24 size-96 rounded-full bg-gold-bright/30 blur-[100px]" />
                <div className="relative grid items-center gap-12 lg:grid-cols-2">
                  <div>
                    <Eyebrow light>Program Gold</Eyebrow>
                    <h2 id="gold-title" className="font-display mt-5 text-balance text-4xl font-medium leading-[1.05] sm:text-6xl">Cu cât înveți mai mult, <span className="text-gold-sheen">cu atât câștigi mai mult.</span></h2>
                    <p className="mt-6 max-w-lg text-lg text-white/65">Clienții cu istoric de participare devin automat Gold. Reducerea și accesul gratuit la activități selectate se aplică fără coduri și fără cereri.</p>
                    <ButtonLink href="/inregistrare" variant="gold" className="mt-10">Creează cont gratuit <Arrow /></ButtonLink>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {[
                      [`${Number(loyalty.gold_discount_percent)}%`, "reducere automată la cursurile viitoare"],
                      ["Gratuit", "acces la activitățile marcate Gold"],
                      ["Automat", "statusul se acordă pe baza istoricului tău"],
                      ["Vizibil", "progresul către Gold, în contul tău"],
                    ].map(([a, b]) => (
                      <li key={a} className="glass rounded-3xl p-6">
                        <p className="font-display text-3xl text-gold-bright">{a}</p>
                        <p className="mt-2 text-sm text-white/65">{b}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      ) : null}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 ? (
        <section className="pb-16 sm:pb-24 lg:pb-32" aria-labelledby="t-title">
          <Container>
            <Reveal>
              <div id="t-title" className="mb-16 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <SectionTitle eyebrow="Testimoniale" title="Ce spun participanții noștri." />
                <ButtonLink href="/testimoniale" variant="ghost">Toate testimonialele <Arrow /></ButtonLink>
              </div>
            </Reveal>
            <TestimonialsGrid items={testimonials} featured />
          </Container>
        </section>
      ) : null}

      {/* FAQ */}
      {partners.length > 0 ? (
        <section aria-label="Materiale și sisteme folosite" className="border-y border-line bg-card py-10">
          <Container>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Materiale și sisteme folosite în curriculum</p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 font-display text-2xl text-foreground/70">
              {partners.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="py-16 sm:py-24 lg:py-32" aria-labelledby="map-title">
        <Container>
          <Reveal><div id="map-title"><SectionTitle eyebrow="Unde ne găsești" title="Dental Masters Academy, București." /></div></Reveal>
          <Reveal className="mt-12"><LocationMap /></Reveal>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24 lg:pb-32" aria-labelledby="faq-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <div id="faq-title"><SectionTitle eyebrow="Întrebări frecvente" title="Totul despre înscriere." /></div>
            </Reveal>
            <Reveal className="lg:col-span-8"><Faq items={faqs} /></Reveal>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="grain relative overflow-hidden bg-ink py-24 text-white sm:py-32">
        <div aria-hidden="true" className="grid-lines absolute inset-0" />
        <Container className="relative text-center">
          <Reveal>
            <h2 className="font-display mx-auto max-w-4xl text-balance text-5xl font-medium leading-[1.02] sm:text-7xl">Locurile sunt limitate. <span className="text-gold-sheen">Rezervă-l pe al tău.</span></h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">Cel mult 20 de participanți per curs. Te înscrii și plătești online, în câteva minute.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/cursuri" variant="gold">Vezi cursurile <Arrow /></ButtonLink>
              <ButtonLink href="/contact" variant="outline">Vorbește cu noi</ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
