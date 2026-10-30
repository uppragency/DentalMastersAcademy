import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { contact } from "@/content/site";
import { LegalShell, LegalText } from "@/components/legal-text";
import { getLegalText } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Politica de cookies"), description: tr("Ce cookie-uri folosește Dental Masters Academy, în ce scop și cât timp sunt păstrate, plus cum le poți controla."), robots: { index: false } };
}

const rows = [
  { name: "sb-*-auth-token", purpose: "Menține sesiunea ta autentificată în cont.", duration: "Sesiune, reînnoit la autentificare", kind: "Strict necesar" },
  { name: "dma_ref", purpose: "Reține codul de recomandare din linkul primit, pentru a aplica reducerea la prima achiziție.", duration: "30 de zile", kind: "Funcțional" },
  { name: "dma-checkout:* (localStorage)", purpose: "Păstrează datele completate în formularul de comandă (fără parolă), ca să nu le pierzi dacă ieși din pagină. Se șterge după comandă.", duration: "Maximum 7 zile", kind: "Funcțional" },
  { name: "dma-theme (localStorage)", purpose: "Reține preferința pentru tema luminoasă sau întunecată.", duration: "Până la ștergere", kind: "Preferințe" },
];

export default async function Page() {
  await getLocale();
  const custom = await getLegalText("legal_cookies");
  if (custom) {
    return (
      <LegalShell title={tr("Politica de cookies")} lead={tr("Folosim doar ce este necesar funcționării platformei.")}>
        <LegalText text={custom} />
      </LegalShell>
    );
  }
  return (
    <LegalShell title={tr("Politica de cookies")} lead={tr("Folosim doar ce este necesar funcționării platformei.")}>
      <p className="mt-6 leading-relaxed text-muted">
        {tr("Folosim doar cookie-uri și stocare locală necesare funcționării platformei. Nu folosim cookie-uri de marketing sau de urmărire publicitară.")}</p>

      <h2 className="mt-10 text-xl font-semibold">{tr("Ce folosim")}</h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-card text-muted">
            <tr><th className="p-4 font-medium">{tr("Nume")}</th><th className="p-4 font-medium">{tr("Scop")}</th><th className="p-4 font-medium">{tr("Durată")}</th><th className="p-4 font-medium">{tr("Tip")}</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name} className="align-top">
                <td className="p-4 font-mono text-xs">{r.name}</td>
                <td className="p-4">{tr(r.purpose)}</td>
                <td className="p-4">{tr(r.duration)}</td>
                <td className="p-4">{tr(r.kind)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold">{tr("Plăți")}</h2>
      <p className="mt-3 leading-relaxed text-muted">
        {tr("La plata cu cardul ești redirecționat către Stripe, care poate seta propriile cookie-uri pentru prevenirea fraudei, conform politicii lor.")}</p>

      <h2 className="mt-10 text-xl font-semibold">{tr("Cum le controlezi")}</h2>
      <p className="mt-3 leading-relaxed text-muted">
        {tr("Poți șterge sau bloca cookie-urile din setările browserului. Fără cookie-urile strict necesare nu te poți autentifica în cont.")}</p>

      <p className="mt-10 text-sm text-muted">
        {tr("Întrebări:")}{" "}<a className="underline underline-offset-4 hover:text-foreground" href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </LegalShell>
  );
}
