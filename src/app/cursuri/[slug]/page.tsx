import { getLocale, lp } from "@/lib/i18n/server";
import { tr } from "@/lib/i18n/server";
import { courseMethods, formatDeadline } from "@/lib/transfer";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ButtonLink, Container, Eyebrow, Arrow } from "@/components/ui";
import { CourseImage } from "@/components/course-image";
import { GalleryCarousel } from "@/components/gallery-carousel";
import { CourseCard } from "@/components/course-card";
import { Countdown } from "@/components/countdown";
import { earlyActive } from "@/lib/pricing";
import { Faq } from "@/components/faq";
import { VideoPlayer } from "@/components/video-player";
import { WaitlistForm } from "@/components/waitlist-form";
import { parseVideo } from "@/lib/video";
import { Reveal } from "@/components/reveal";
import { getCourseBySlug, getCourseRating, getCourses, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings, getPendingTransfer, getSeatCounts, getTrainers } from "@/lib/data";
import { tierPerks } from "@/lib/loyalty";
import { formatDate, formatDateRange, formatLabels, formatPrice, isDateTbd, isEnded, isNotOpen } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { JsonLd } from "@/components/json-ld";
import { courseJsonLd, eventJsonLd, faqJsonLd } from "@/lib/structured-data";
import { TrainerAvatar } from "@/components/trainer-avatar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.summary ?? undefined,
    alternates: { canonical: lp(`/cursuri/${course.slug}`) },
    openGraph: { title: course.title, description: course.summary ?? undefined, type: "website" },
  };
}

function paragraphsOf(c: { description: string | null }) {
  return (c.description ?? "").split(/\n\n+/).filter(Boolean);
}

export default async function CoursePage({ params }: Props) {
  await getLocale();
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  const [trainers, seatCounts, enrolledIds, related, rating] = await Promise.all([
    getTrainers(),
    getSeatCounts(),
    profile ? getEnrolledCourseIds(profile.id) : Promise.resolve([] as string[]),
    getCourses({ limit: 4 }),
    getCourseRating(course.id),
  ]);
  const enrolled = enrolledIds.includes(course.id);
  const pendingTransfer = profile && !enrolled ? await getPendingTransfer(profile.id, course.id) : null;
  if (profile && !enrolled) {
    const uid = profile.id;
    after(async () => {
      await createAdminClient().rpc("track_course_view", { p_user: uid, p_course: course.id });
    });
  }
  const now = nowMs();
  const ended = isEnded(course, now);
  const perk = tierPerks(profile?.tier ?? "standard", loyalty);
  const dateTbd = !ended && isDateTbd(course);
  const notOpen = !ended && (dateTbd || isNotOpen(course, now, perk.earlyMs));
  const taken = seatCounts[course.id] ?? 0;
  const soldOut = Boolean(course.capacity && taken >= course.capacity);
  const promo = parseVideo(course.promo_video_url);
  const navItems = [
    ...(promo ? [["promo", tr("Video")]] : []),
    ...(paragraphsOf(course).length ? [["desc", tr("Despre")]] : []),
    ...(course.outcomes.length ? [["out", tr("Rezultate")]] : []),
    ...(course.sections.length ? [["prog", tr("Programa")]] : []),
    ...(course.audience.length ? [["aud", tr("Pentru cine")]] : []),
    ["lect", tr("Lectori")],
    ...(course.faqs.length ? [["faq", tr("Întrebări")]] : []),
  ];

  const discount = perk.discountPercent;
  const early = earlyActive(course, now);
  const finalPrice = Math.round(course.price_cents * (1 - discount / 100));
  const free = Boolean(perk.member && course.gold_free);
  const others = related.filter((c) => c.id !== course.id).slice(0, 3);
  const paragraphs = paragraphsOf(course);

  const facts = [
    { k: tr("Data"), v: course.starts_at ? formatDateRange(course.starts_at, course.ends_at) : tr("Va fi anunțată") },
    ...(course.trainer_name ? [{ k: tr("Lectori"), v: course.trainer_name }] : []),
    { k: tr("Format"), v: formatLabels[course.format] },
    ...(course.location ? [{ k: tr("Locație"), v: course.location }] : []),
    ...(course.language ? [{ k: tr("Limba"), v: course.language }] : []),
  ];

  return (
    <>
      <JsonLd data={[courseJsonLd(course, rating, course.trainer_name), eventJsonLd(course, soldOut), faqJsonLd(course.faqs)]} />
      <section className="grain relative isolate overflow-hidden bg-ink text-white">
        <CourseImage course={course} variant="cover" priority sizes="100vw" className="absolute inset-0 -z-10 size-full" artClassName="absolute inset-0 -z-10 size-full scale-110 opacity-60" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <Container className="pb-[70px] pt-16 sm:pb-40 sm:pt-24 lg:pb-48">
          <nav aria-label={tr("Breadcrumb")} className="rise text-sm text-white/55">
            <Link href="/cursuri" className="hover:text-white">{tr("Cursuri")}</Link>
          </nav>
          <div className="rise mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ ["--d" as string]: "80ms" }}>
            {ended ? <span className="rounded-full bg-red-600 px-3.5 py-1.5 text-white">{tr("Înscrieri închise")}</span> : null}
            {notOpen ? <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-white backdrop-blur">{tr("Înscrieri în curând")}</span> : null}
            {soldOut && !ended ? <span className="rounded-full bg-red-600 px-3.5 py-1.5 text-white">{tr("Ediție completă")}</span> : null}
            {course.kind === "hosted" ? <span className="rounded-full border border-white/30 px-3.5 py-1.5 text-white/85">{tr("Curs găzduit")}</span> : null}
            {course.gold_free ? <span className="rounded-full border border-gold-bright/60 px-3.5 py-1.5 text-gold-bright">{tr("Gratuit pentru membrii Gold")}</span> : null}
          </div>
          <h1 className="rise font-display mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.02] sm:text-7xl" style={{ ["--d" as string]: "160ms" }}>{course.title}</h1>
          {course.powered_by ? <p className="rise mt-4 text-sm font-medium text-gold-bright">{course.powered_by_url ? <>{tr("Powered by")}{" "}<a href={course.powered_by_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{course.powered_by}</a></> : <>{tr("Powered by")}{" "}{course.powered_by}</>}</p> : null}
          {course.summary ? <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-white/65" style={{ ["--d" as string]: "240ms" }}>{course.summary}</p> : null}
        </Container>
      </section>

      <nav aria-label={tr("Secțiuni curs")} className="sticky top-[72px] z-30 hidden border-b border-line bg-background/85 backdrop-blur-xl lg:block">
        <Container>
          <ul className="flex gap-1 overflow-x-auto py-2 text-sm">
            {navItems.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="whitespace-nowrap rounded-full px-4 py-2 text-muted transition-colors hover:bg-card hover:text-foreground">{label}</a></li>
            ))}
          </ul>
        </Container>
      </nav>

      <Container className="relative -mt-28 pb-24 lg:-mt-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-20 pt-32 lg:pt-44 [&_section]:scroll-mt-32">
            {promo ? (
              <section id="promo" aria-label={tr("Video de prezentare")}>
                <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-ink shadow-[0_40px_80px_-40px_rgba(8,13,23,.6)]">
                  <VideoPlayer source={promo} title={`Prezentare ${course.title}`} />
                </div>
              </section>
            ) : null}
            {paragraphs.length > 0 ? (
              <Reveal>
                <section id="desc" aria-labelledby="desc-h">
                  <Eyebrow>{tr("Despre curs")}</Eyebrow>
                  <h2 id="desc-h" className="sr-only">{tr("Despre curs")}</h2>
                  <div className="mt-6 space-y-5">
                    {paragraphs.map((p, i) => (
                      <p key={i} className={i === 0 ? "font-display text-2xl leading-snug sm:text-3xl" : "text-lg leading-relaxed text-muted"}>{p}</p>
                    ))}
                  </div>
                  {course.gallery && course.gallery.length > 0 ? <div className="mt-10"><GalleryCarousel images={course.gallery} title={course.title} /></div> : null}
                </section>
              </Reveal>
            ) : null}

            {course.outcomes.length > 0 ? (
              <section id="out" aria-labelledby="out-h">
                <Reveal><Eyebrow>{tr("Ce vei învăța")}</Eyebrow></Reveal>
                <h2 id="out-h" className="sr-only">{tr("Ce vei învăța")}</h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {course.outcomes.map((o, i) => (
                    <Reveal as="li" key={o} delay={(i % 2) * 80}>
                      <div className="flex h-full gap-4 rounded-3xl border border-line bg-card p-6">
                        <span className="font-display text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-[15px] leading-relaxed">{o}</p>
                      </div>
                    </Reveal>
                  ))}
                </ul>
              </section>
            ) : null}

            {course.sections.length > 0 ? (
              <section id="prog" aria-labelledby="prog-h">
                <Reveal><Eyebrow>{tr("Programa")}</Eyebrow></Reveal>
                <h2 id="prog-h" className="sr-only">{tr("Programa")}</h2>
                <div className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
                  {course.sections.map((s, i) => (
                    <details key={s.title} open={i === 0} className="group">
                      <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-medium tracking-tight sm:px-8 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-4"><span className="font-display text-gold">{String(i + 1).padStart(2, "0")}</span>{s.title}</span>
                        <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-line group-open:bg-ink group-open:text-white">
                          <span className="absolute h-px w-3.5 bg-current" />
                          <span className="absolute h-3.5 w-px bg-current transition-transform group-open:rotate-90" />
                        </span>
                      </summary>
                      <ul className="space-y-3 px-6 pb-7 sm:px-8 sm:pl-[4.5rem]">
                        {s.items.map((it) => (
                          <li key={it} className="flex gap-3 text-[15px] text-muted"><span className="mt-2.5 size-1 shrink-0 rotate-45 bg-gold" />{it}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {course.audience.length > 0 ? (
              <section id="aud" aria-labelledby="aud-h">
                <Reveal>
                  <div className="rounded-[2rem] bg-ink p-8 text-white sm:p-12">
                    <Eyebrow light>{tr("Pentru cine este")}</Eyebrow>
                    <h2 id="aud-h" className="font-display mt-4 text-3xl sm:text-4xl">{tr("Pentru medicii care vor mai mult de la practica lor.")}</h2>
                    <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                      {course.audience.map((a) => (
                        <li key={a} className="flex gap-3 border-t border-white/10 pt-4 text-[15px] text-white/75"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-bright" />{a}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </section>
            ) : null}

            <section id="lect" aria-labelledby="lect-h">
              <Reveal><Eyebrow>{tr("Lectori")}</Eyebrow></Reveal>
              <h2 id="lect-h" className="sr-only">{tr("Lectori")}</h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                {trainers.map((t, i) => (
                  <Reveal as="li" key={t.id} delay={i * 80}>
                    <Link href={`/lectori/${t.slug}`} className="block h-full rounded-3xl border border-line bg-card p-6 transition-colors hover:border-gold/50">
                      <TrainerAvatar name={t.name} photo={t.photo_url} size={56} />
                      <p className="font-display mt-4 text-lg leading-snug">{t.name}</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{t.role}</p>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </section>

            {course.faqs.length > 0 ? (
              <section id="faq" aria-labelledby="faq-h">
                <Reveal><Eyebrow>{tr("Întrebări frecvente")}</Eyebrow></Reveal>
                <h2 id="faq-h" className="sr-only">{tr("Întrebări frecvente")}</h2>
                <div className="mt-8"><Faq items={course.faqs} /></div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-28 lg:z-40 lg:self-start" aria-label={tr("Înscriere")}>
            <div className="overflow-hidden rounded-[2rem] border border-line bg-card shadow-[0_40px_80px_-40px_rgba(8,13,23,.5)]">
              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{enrolled ? tr("Status") : ended ? tr("Preț ediție") : tr("Investiție")}</p>
                <p className="font-display mt-2 text-5xl font-medium tracking-tight">
                  {enrolled ? tr("Achiziționat") : free ? tr("Gratuit") : dateTbd && course.price_cents === 0 ? tr("Preț în curând") : formatPrice(finalPrice, course.currency)}
                </p>
                {!enrolled && !free && (discount > 0 || course.old_price_cents) ? (
                  <p className="mt-2 text-sm text-muted">
                    <span className="line-through">{formatPrice(discount > 0 ? course.price_cents : course.old_price_cents!, course.currency)}</span>
                    {discount > 0 ? <span className="ml-2 font-medium text-gold">{tr("Reducere")}{" "}{perk.name} {discount}%</span> : <span className="ml-2 font-medium text-gold">{early ? tr("Preț early bird") : tr("Preț redus")}</span>}
                  </p>
                ) : null}
                {early && !enrolled && !free && !ended ? (
                  <div className="mt-6 rounded-2xl bg-gold-soft p-4">
                    <p className="text-sm font-medium">{tr("Preț early bird până pe")}{" "}{formatDate(course.early_until!)}{tr(". Apoi")}{" "}{formatPrice(course.old_price_cents!, course.currency)}.</p>
                    <div className="mt-3"><Countdown to={course.early_until!} label={tr("Timp rămas până la finalul prețului early bird")} /></div>
                  </div>
                ) : null}

                <dl className="mt-7 space-y-4 border-t border-line pt-7 text-sm">
                  {facts.map((f) => (
                    <div key={f.k} className="flex justify-between gap-4"><dt className="text-muted">{f.k}</dt><dd className="text-right font-medium">{f.v}</dd></div>
                  ))}
                </dl>

                {enrolled ? (
                  <>
                    <ButtonLink href={`/cont/cursuri/${course.slug}`} className="mt-8 w-full">{tr("Accesează cursul")}{" "}<Arrow /></ButtonLink>
                    <p className="mt-3 text-center text-xs text-muted">{tr("Ai achiziționat deja acest curs.")}</p>
                  </>
                ) : pendingTransfer ? (
                  <div className="mt-8 rounded-2xl border border-gold bg-gold-soft p-5 text-sm" id="transfer-in-asteptare">
                    <p className="font-semibold">{tr("Ai o comandă prin transfer bancar în așteptare")}</p>
                    <p className="mt-2 leading-relaxed text-muted">
                      {tr("Locul tău este rezervat până")}{" "}{formatDeadline(pendingTransfer.expires_at)}{tr(". Finalizează plata prin transfer sau plătește acum cu cardul.")}</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <ButtonLink href={`/multumim/${pendingTransfer.id}`} variant="gold" className="w-full">{tr("Vezi datele pentru transfer")}</ButtonLink>
                      {courseMethods(course.payment_methods).includes("card") ? <ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="ghost" className="w-full">{tr("Plătește cu cardul")}</ButtonLink> : null}
                    </div>
                    {courseMethods(course.payment_methods).includes("card") ? <p className="mt-3 text-xs text-muted">{tr("Dacă plata cu cardul reușește, comanda prin transfer se anulează automat.")}</p> : null}
                  </div>
                ) : ended || notOpen || soldOut ? (
                  <div className="mt-8" id="lista-asteptare">
                    {ended ? (
                      <p role="status" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800">{tr("Înscrieri închise")}</p>
                    ) : notOpen ? (
                      <div>
                        {dateTbd || !course.registration_opens_at ? (
                          <p role="status" className="rounded-2xl border border-gold bg-gold-soft px-4 py-3 text-center text-sm font-semibold">{tr("Data ediției va fi anunțată")}</p>
                        ) : (
                          <>
                            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-gold">{tr("Înscrierile se deschid în")}</p>
                            <Countdown to={course.registration_opens_at} />
                          </>
                        )}
                      </div>
                    ) : (
                      <p role="status" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800">{tr("Ediție completă")}</p>
                    )}
                    <p className="mb-4 mt-5 text-center text-xs leading-relaxed text-muted">
                      {ended || soldOut ? tr("Lasă-ți datele și te anunțăm când se deschide următoarea ediție.") : tr("Lasă-ți datele și îți scriem în momentul deschiderii.")}
                    </p>
                    <WaitlistForm courseId={course.id} />
                  </div>
                ) : (
                  <>
                    <ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="gold" className="mt-8 w-full">
                      {free ? tr("Înscrie-te gratuit") : tr("Înscrie-te acum")} <Arrow />
                    </ButtonLink>
                    <p className="mt-3 text-center text-xs text-muted">{profile ? tr("Plată securizată cu cardul.") : tr("Contul se creează la finalizarea comenzii.")}</p>
                  </>
                )}
              </div>
              <div className="border-t border-line bg-gold-soft/60 px-8 py-5 text-xs leading-relaxed text-muted">
                {tr("Confirmarea și datele contului ajung pe email imediat după plată.")}</div>
            </div>
          </aside>
        </div>
      </Container>

      {!enrolled && !pendingTransfer && !ended && !notOpen && !soldOut ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted">{free ? tr("Acces") : tr("Investiție")}</p>
              <p className="text-xl font-semibold tracking-tight">{free ? tr("Gratuit") : dateTbd && course.price_cents === 0 ? tr("Preț în curând") : formatPrice(finalPrice, course.currency)}</p>
            </div>
            <ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="gold" className="px-6">{tr("Înscrie-te")}{" "}<Arrow /></ButtonLink>
          </div>
        </div>
      ) : null}

      {others.length > 0 ? (
        <section className="border-t border-line bg-card py-20">
          <Container>
            <Reveal><h2 className="font-display text-4xl">{tr("Alte cursuri")}</h2></Reveal>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {others.map((c, i) => (
                <Reveal as="li" key={c.id} delay={i * 90}><CourseCard course={c} ended={isEnded(c, now)} /></Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
