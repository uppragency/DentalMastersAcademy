import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { TestimonialsGrid } from "@/components/testimonials";
import { getTestimonials } from "@/lib/data";

export const metadata: Metadata = { title: "Testimoniale", description: "Ce spun medicii stomatologi care au participat la cursurile Dental Masters Academy: experiențe verificate din ediții reale." };

export default async function TestimonialsPage() {
  const items = await getTestimonials();
  return (
    <>
      <PageHero eyebrow="Testimoniale" title={<>Ce spun <span className="text-gold-sheen">participanții.</span></>} lead="Păreri sincere ale medicilor care au trecut prin cursurile noastre." />
      <Container className="py-16 sm:py-24">
        {items.length > 0 ? <TestimonialsGrid items={items} /> : <p className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Testimonialele vor apărea aici.</p>}
      </Container>
    </>
  );
}
