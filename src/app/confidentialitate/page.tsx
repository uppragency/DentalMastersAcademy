import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Politica de confidențialitate", robots: { index: false } };

export default function Page() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Politica de confidențialitate</h1>
      <p className="mt-6 leading-relaxed text-muted">Textul legal se completează înainte de lansare, pe baza documentelor furnizate de client.</p>
    </Container>
  );
}
