import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Termeni și condiții", robots: { index: false } };

export default function Page() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Termeni și condiții</h1>
      <p className="mt-6 leading-relaxed text-muted">Textul legal se completează înainte de lansare, pe baza documentelor furnizate de client.</p>
    </Container>
  );
}
