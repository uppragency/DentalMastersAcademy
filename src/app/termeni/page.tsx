import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { DefaultLegal, LegalShell, LegalText } from "@/components/legal-text";
import { termeni } from "@/content/legal";
import { getLegalText } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Termeni și condiții"), description: tr("Termenii și condițiile de utilizare a platformei Dental Masters Academy: înscriere, plată, rambursare și transfer de loc."), robots: { index: false } };
}

export default async function Page() {
  const text = await getLegalText("legal_termeni");
  return <LegalShell title={tr("Termeni și condiții")} lead={tr("Regulile de utilizare a platformei și de achiziție a cursurilor.")}>{text ? <LegalText text={text} /> : <DefaultLegal doc={termeni} />}</LegalShell>;
}
