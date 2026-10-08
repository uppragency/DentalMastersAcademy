import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui";
import { TestimonialsGrid } from "@/components/testimonials";
import { getTestimonials } from "@/lib/data";

export const metadata: Metadata = { title: "Testimoniale" };

export default async function TestimonialsPage() {
  const items = await getTestimonials();
  return (
    <Container className="py-16">
      <Eyebrow>Testimoniale</Eyebrow>
      <h1 className="mb-10 mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Ce spun medicii care au participat</h1>
      {items.length > 0 ? (
        <TestimonialsGrid items={items} />
      ) : (
        <p className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Testimonialele vor apărea aici.</p>
      )}
    </Container>
  );
}
