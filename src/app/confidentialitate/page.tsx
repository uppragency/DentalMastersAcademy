import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { LegalText } from "@/components/legal-text";
import { getLegalText } from "@/lib/site-content";

export const metadata: Metadata = { title: "Politica de confidențialitate", robots: { index: false } };

export default async function Page() {
  const text = await getLegalText("legal_confidentialitate");
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Politica de confidențialitate</h1>
      {text ? <LegalText text={text} /> : <p className="mt-6 leading-relaxed text-muted">Textul legal se completează înainte de lansare, pe baza documentelor furnizate de client.</p>}
    </Container>
  );
}
