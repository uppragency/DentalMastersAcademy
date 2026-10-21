import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getPartnerRows } from "@/lib/data";

export const metadata: Metadata = {
  title: "Partenerii noștri",
  description: "Companiile și laboratorul care susțin educația clinică din Dental Masters Academy: Straumann, iDentical Lab, DÜRR Dental, Invictus și G-Diff.",
};

export default async function PartnersPage() {
  const partners = await getPartnerRows();
  return (
    <>
      <PageHero eyebrow="Parteneri" title={<>Partenerii <span className="text-gold-sheen">noștri.</span></>} lead="Companiile și laboratorul care susțin educația clinică din academie, de la planificare digitală la lucrarea protetică finală." />
      <section className="py-16 sm:py-24">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2">
            {partners.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 2) * 90}>
                <article className="flex h-full flex-col rounded-[2rem] border border-line bg-card p-8 sm:p-10">
                  <div className="flex h-16 items-center">
                    {p.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo_url} alt={p.name} className="max-h-16 w-auto max-w-[220px] object-contain" />
                    ) : (
                      <span className="font-display text-3xl">{p.name}</span>
                    )}
                  </div>
                  {p.description ? <p className="mt-6 leading-relaxed text-muted">{p.description}</p> : null}
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-8 text-sm font-medium text-gold underline-offset-4 hover:underline">
                      Vizitează site-ul {p.name}
                    </a>
                  ) : null}
                </article>
              </Reveal>
            ))}
            {partners.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-12 text-center text-muted md:col-span-2">Partenerii vor apărea aici.</li> : null}
          </ul>
        </Container>
      </section>
    </>
  );
}
