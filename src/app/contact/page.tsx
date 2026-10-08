import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container className="max-w-2xl py-16">
      <Eyebrow>Contact</Eyebrow>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Scrie-ne</h1>
      <p className="mt-3 text-muted">Pentru întrebări despre cursuri, înscrieri sau plată, completează formularul și îți răspundem rapid.</p>
      <div className="mt-10 rounded-3xl border border-line bg-card p-7">
        <ContactForm />
      </div>
    </Container>
  );
}
