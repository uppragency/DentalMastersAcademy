import type { Metadata } from "next";
import { DefaultLegal, LegalShell, LegalText } from "@/components/legal-text";
import { termeni } from "@/content/legal";
import { getLegalText } from "@/lib/site-content";

export const metadata: Metadata = { title: "Termeni și condiții", robots: { index: false } };

export default async function Page() {
  const text = await getLegalText("legal_termeni");
  return <LegalShell title="Termeni și condiții" lead="Regulile de utilizare a platformei și de achiziție a cursurilor.">{text ? <LegalText text={text} /> : <DefaultLegal doc={termeni} />}</LegalShell>;
}
