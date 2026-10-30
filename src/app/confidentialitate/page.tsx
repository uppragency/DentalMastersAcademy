import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { DefaultLegal, LegalShell, LegalText } from "@/components/legal-text";
import { confidentialitate } from "@/content/legal";
import { getLegalText } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Politica de confidențialitate"), description: tr("Cum prelucrează Dental Masters Academy datele personale ale cursanților: scop, durată, drepturile tale conform GDPR."), robots: { index: false } };
}

export default async function Page() {
  const text = await getLegalText("legal_confidentialitate");
  return <LegalShell title={tr("Politica de confidențialitate")} lead={tr("Ce date colectăm, de ce și cum îți exerciți drepturile.")}>{text ? <LegalText text={text} /> : <DefaultLegal doc={confidentialitate} />}</LegalShell>;
}
