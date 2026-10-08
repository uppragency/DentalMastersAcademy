import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { contact } from "@/content/site";
import { LegalText } from "@/components/legal-text";
import { getLegalText } from "@/lib/site-content";

export const metadata: Metadata = { title: "Politica de cookies", robots: { index: false } };

const rows = [
  { name: "sb-*-auth-token", purpose: "Menține sesiunea ta autentificată în cont.", duration: "Sesiune, reînnoit la autentificare", kind: "Strict necesar" },
  { name: "dma_ref", purpose: "Reține codul de recomandare din linkul primit, pentru a aplica reducerea la prima achiziție.", duration: "30 de zile", kind: "Funcțional" },
  { name: "dma-theme (localStorage)", purpose: "Reține preferința pentru tema luminoasă sau întunecată.", duration: "Până la ștergere", kind: "Preferințe" },
];

export default async function Page() {
  const custom = await getLegalText("legal_cookies");
  if (custom) {
    return (
      <Container className="max-w-3xl py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Politica de cookies</h1>
        <LegalText text={custom} />
      </Container>
    );
  }
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Politica de cookies</h1>
      <p className="mt-6 leading-relaxed text-muted">
        Folosim doar cookie-uri și stocare locală necesare funcționării platformei. Nu folosim cookie-uri de marketing sau de urmărire publicitară.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Ce folosim</h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-card text-muted">
            <tr><th className="p-4 font-medium">Nume</th><th className="p-4 font-medium">Scop</th><th className="p-4 font-medium">Durată</th><th className="p-4 font-medium">Tip</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name} className="align-top">
                <td className="p-4 font-mono text-xs">{r.name}</td>
                <td className="p-4">{r.purpose}</td>
                <td className="p-4">{r.duration}</td>
                <td className="p-4">{r.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Plăți</h2>
      <p className="mt-3 leading-relaxed text-muted">
        La plata cu cardul ești redirecționat către Stripe, care poate seta propriile cookie-uri pentru prevenirea fraudei, conform politicii lor.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Cum le controlezi</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Poți șterge sau bloca cookie-urile din setările browserului. Fără cookie-urile strict necesare nu te poți autentifica în cont.
      </p>

      <p className="mt-10 text-sm text-muted">
        Întrebări: <a className="underline underline-offset-4 hover:text-foreground" href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </Container>
  );
}
