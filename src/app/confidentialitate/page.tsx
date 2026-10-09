import type { Metadata } from "next";
import { DefaultLegal, LegalShell, LegalText } from "@/components/legal-text";
import { confidentialitate } from "@/content/legal";
import { getLegalText } from "@/lib/site-content";

export const metadata: Metadata = { title: "Politica de confidențialitate", description: "Cum prelucrează Dental Masters Academy datele personale ale cursanților: scop, durată, drepturile tale conform GDPR.", robots: { index: false } };

export default async function Page() {
  const text = await getLegalText("legal_confidentialitate");
  return <LegalShell title="Politica de confidențialitate" lead="Ce date colectăm, de ce și cum îți exerciți drepturile.">{text ? <LegalText text={text} /> : <DefaultLegal doc={confidentialitate} />}</LegalShell>;
}
