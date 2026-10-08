import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getEvents } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Evenimente", description: "Ediții anterioare ale cursurilor Dental Masters Academy." };

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <PageHero eyebrow="Evenimente" title="Edițiile care au avut loc." lead="Imagini și cifre din cursurile anterioare." />
      <section className="py-20">
        <Container className="space-y-16">
          {events.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Galeria va fi completată după primele ediții.</p>
          ) : null}
          {events.map((ev) => (
            <Reveal key={ev.id}>
              <article>
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{formatDate(ev.event_date)}{ev.location ? ` · ${ev.location}` : ""}</p>
                    <h2 className="font-display mt-2 text-3xl">{ev.title}</h2>
                  </div>
                  {ev.participants ? <p className="text-sm text-muted"><span className="font-display text-3xl text-foreground">{ev.participants}</span> participanți</p> : null}
                </div>
                {ev.description ? <p className="mt-5 max-w-3xl text-muted">{ev.description}</p> : null}
                {ev.photos.length > 0 ? (
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ev.photos.map((src) => (
                      <li key={src} className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink"><Image src={src} alt={`${ev.title}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" /></li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </Reveal>
          ))}
        </Container>
      </section>
    </>
  );
}
