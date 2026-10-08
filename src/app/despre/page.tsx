import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Despre noi" };

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <Eyebrow>Despre noi</Eyebrow>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Dental Masters Academy</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">
        Textul de prezentare a brandului, a formatorilor și a expertizei academiei se completează din materialele furnizate de client.
      </p>
    </Container>
  );
}
