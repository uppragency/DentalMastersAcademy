import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";
import { CourseImage } from "@/components/course-image";
import { ButtonLink, Container } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, formatLabels, formatPrice } from "@/lib/format";
import { contact } from "@/content/site";
import type { Course } from "@/lib/types";

export type ThanksCourse = Pick<Course, "slug" | "title" | "starts_at" | "ends_at" | "format" | "location" | "cover_url" | "thumbnail_url" | "parking_info" | "bring_info">;
export const thanksCourseSelect = "slug, title, starts_at, ends_at, format, location, cover_url, thumbnail_url, parking_info, bring_info";

/** Shared thank-you screen. `order` is null for free enrollments (no payment). */
export async function ThankYouView({ profile, course, order, status }: {
  profile: { id: string; full_name: string | null; email: string };
  course: ThanksCourse | null | undefined;
  order: { id: string; total_cents: number; currency: string } | null;
  status: "paid" | "pending" | "free" | "other";
}) {
  const supabase = await createClient();
  const o = order;
  const paid = status === "paid";
  const free = status === "free";
  const waiting = status === "pending";
  const first = profile.full_name?.split(" ")[0] ?? "";
  const physical = course?.format !== "online";
  const [{ data: me }] = await Promise.all([supabase.from("profiles").select("referral_code").eq("id", profile.id).single()]);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/r/${me?.referral_code ?? ""}`;

  const steps = [
    { t: "Confirmarea ajunge pe email", d: `Am trimis detaliile la ${profile.email}. Dacă nu o găsești în câteva minute, verifică și Spam.` },
    physical
      ? { t: "Te pregătim pentru curs", d: "Cu 7 zile înainte primești un email cu programul pe zile, parcarea și ce să aduci." }
      : { t: "Cursul este în contul tău", d: "Lecțiile și materialele sunt disponibile imediat în Cursurile mele, în ritmul tău." },
    free
      ? { t: "Totul rămâne în contul tău", d: "Găsești cursul, programul și notificările în Cursurile mele, oricând." }
      : { t: "Factura și dovada de plată", d: "Le găsești oricând în contul tău, la Achiziții. Factura fiscală apare acolo imediat ce este emisă." },
  ];

  return (
    <>
      {waiting ? <AutoRefresh /> : null}
      <section className="grain relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
        <div aria-hidden="true" className="drift absolute -right-32 -top-40 -z-10 size-[480px] rounded-full bg-gold/25 blur-[110px]" />
        <Container className="py-16 sm:py-24 lg:py-28">
          <div className="rise flex size-16 items-center justify-center rounded-full bg-gold-bright text-ink shadow-[0_20px_50px_-15px_rgba(217,180,90,.7)]">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </div>
          <p className="rise mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-bright" style={{ ["--d" as string]: "80ms" }}>
            {free ? "Înscriere confirmată" : paid ? "Plată confirmată" : waiting ? "Confirmăm plata" : "Comandă înregistrată"}
          </p>
          <h1 className="rise font-display mt-4 max-w-4xl text-balance text-5xl font-medium leading-[1.02] sm:text-7xl" style={{ ["--d" as string]: "140ms" }}>
            Mulțumim{first ? `, ${first}` : ""}. <span className="text-gold-sheen">Ne vedem la curs.</span>
          </h1>
          <p className="rise mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/65" style={{ ["--d" as string]: "220ms" }}>
            {free
              ? "Locul tău este rezervat, fără nimic de plătit. Echipa Dental Masters Academy te așteaptă cu drag."
              : paid
              ? "Locul tău este rezervat. Ai făcut un pas important pentru practica ta, iar echipa Dental Masters Academy este alături de tine de acum înainte."
              : waiting
                ? "Banca ne confirmă plata, de obicei în câteva secunde. Pagina se actualizează singură, nu este nevoie să o reîncarci."
                : "Comanda ta a fost înregistrată. Dacă ai întrebări, ne poți scrie oricând."}
          </p>
        </Container>
      </section>

      <Container className="grid gap-8 py-14 sm:py-20 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          {course ? (
            <article className="overflow-hidden rounded-[2rem] border border-line bg-card">
              <div className="relative aspect-[16/7] bg-ink">
                <CourseImage course={course} variant="thumb" sizes="(min-width: 1024px) 55vw, 100vw" className="size-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              </div>
              <div className="p-7 sm:p-9">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{o ? `Comanda ${o.id.slice(0, 8).toUpperCase()}` : "Înscriere gratuită"}</p>
                <h2 className="font-display mt-3 text-3xl leading-snug">{course.title}</h2>
                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                  {course.starts_at ? (<><dt className="text-muted">Data</dt><dd>{formatDateRange(course.starts_at, course.ends_at)}</dd></>) : null}
                  <dt className="text-muted">Format</dt><dd>{formatLabels[course.format]}</dd>
                  {course.location ? (<><dt className="text-muted">Locație</dt><dd>{course.location}</dd></>) : null}
                  <dt className="text-muted">{o ? "Total plătit" : "Preț"}</dt><dd className="font-semibold">{o ? formatPrice(o.total_cents, o.currency.trim()) : "Gratuit"}</dd>
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={`/cont/cursuri/${course.slug}`}>{physical ? "Vezi detaliile cursului" : "Începe cursul"}</ButtonLink>
                  {course.starts_at ? <a href={`/cont/cursuri/${course.slug}/calendar.ics`} className="inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-medium hover:border-foreground/30">Adaugă în calendar</a> : null}
                  {o ? <ButtonLink href={`/cont/comenzi/${o.id}`} variant="ghost">Dovadă de plată</ButtonLink> : null}
                </div>
              </div>
            </article>
          ) : null}

          <section aria-labelledby="next-h" className="rounded-[2rem] border border-line bg-card p-7 sm:p-9">
            <h2 id="next-h" className="font-display text-2xl">Ce urmează</h2>
            <ol className="mt-6 space-y-6">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-sm font-semibold text-gold">{i + 1}</span>
                  <div><h3 className="font-medium">{s.t}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          {physical && (course?.parking_info || course?.bring_info) ? (
            <section className="rounded-[2rem] border border-line bg-card p-7">
              <h2 className="font-display text-xl">Pentru ziua cursului</h2>
              <dl className="mt-4 space-y-4 text-sm">
                {course?.parking_info ? (<div><dt className="text-muted">Parcare și acces</dt><dd className="mt-1">{course.parking_info}</dd></div>) : null}
                {course?.bring_info ? (<div><dt className="text-muted">Ce să aduci</dt><dd className="mt-1">{course.bring_info}</dd></div>) : null}
              </dl>
            </section>
          ) : null}

          <section className="rounded-[2rem] bg-ink p-7 text-white">
            <h2 className="font-display text-2xl">Un coleg ar putea învăța alături de tine</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">Trimite-i linkul tău. Colegul primește o reducere la prima achiziție, iar tu primești o recompensă când plătește.</p>
            <div className="mt-5 break-all rounded-2xl bg-white/10 px-4 py-3 font-mono text-xs text-white/80">{link}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyButton value={link} />
              <Link href="/cont/recomanda" className="inline-flex min-h-10 items-center px-2 text-sm font-medium text-gold-bright underline underline-offset-4">Vezi recompensele</Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-card p-7 text-sm">
            <h2 className="font-display text-xl">Ai nevoie de ajutor?</h2>
            <p className="mt-2 text-muted">Răspundem rapid la orice întrebare despre comandă sau curs.</p>
            <div className="mt-4 space-y-1.5 font-medium">
              <a className="block hover:text-gold" href={contact.phoneHref}>{contact.phone}</a>
              <a className="block hover:text-gold" href={`mailto:${contact.email}`}>{contact.email}</a>
            </div>
            <Link href="/cont" className="mt-5 inline-block text-muted underline underline-offset-4 hover:text-foreground">Mergi în contul meu</Link>
          </section>
        </aside>
      </Container>
    </>
  );
}
