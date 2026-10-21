import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Mentorat clinic",
  description: "Vino cu propriul pacient în cabinetul DMA și beneficiază de experiența echipei noastre, cu îndrumare în timpul intervenției sau în format over-the-shoulder.",
};

export default function MentorshipPage() {
  return (
    <>
      <PageHero eyebrow="Mentorat clinic" title={<>Cazul tău, cu <span className="text-gold-sheen">experții DMA.</span></>} lead="Vino cu propriul pacient în cabinetul DMA și beneficiază de experiența echipei noastre." />
      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted lg:col-span-7">
            <p>
              În funcție de complexitatea cazului și de obiectivele tale de învățare, poți realiza intervenția cu îndrumarea experților noștri sau poți asista la intervenția efectuată de aceștia, în format over-the-shoulder.
            </p>
            <p>Cazul, planul de tratament și modul de implicare sunt stabilite împreună, înaintea intervenției.</p>
            <div className="pt-4"><ButtonLink href="/contact#medici" variant="gold">Discută un caz cu echipa DMA</ButtonLink></div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={120}>
            <ol className="space-y-5 rounded-[2rem] border border-line bg-card p-8">
              {["Ne trimiți cazul și investigațiile disponibile.", "Echipa analizează informațiile și discută cu tine opțiunile.", "Stabilim împreună planul de tratament și rolul tău în intervenție.", "Intervenția are loc în cabinetul DMA."].map((t, i) => (
                <li key={t} className="flex gap-4"><span className="font-display text-3xl text-gold">{i + 1}</span><span className="pt-1.5">{t}</span></li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
