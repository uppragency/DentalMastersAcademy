import type { Metadata } from "next";
import { contact } from "@/content/site";
import { LegalShell, LegalText } from "@/components/legal-text";
import { getLegalText } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Politica de rambursare și transfer de loc",
  description: "Cum poți anula o înscriere, cum se returnează banii și cum îți transferi locul unui coleg.",
  alternates: { canonical: "/rambursare" },
};

const sections = [
  {
    title: "Anularea de către participant",
    items: [
      "Anularea se face în scris, prin email la adresa de contact, cu numele și cursul la care ești înscris/ă.",
      "Cu cât anunți mai devreme, cu atât rambursarea este mai mare. Condițiile exacte pentru fiecare curs sunt cele afișate la înscriere.",
      "Rambursarea se face în același mod în care ai plătit: pe cardul folosit la plată sau prin transfer bancar.",
      "Banii ajung în cont în 5 până la 10 zile lucrătoare, în funcție de bancă.",
    ],
  },
  {
    title: "Transferul locului",
    items: [
      "Dacă nu mai poți participa, îți poți transfera locul unui coleg, fără costuri suplimentare.",
      "Cere transferul în scris cu cel puțin 3 zile înainte de începerea cursului, cu numele și emailul persoanei care preia locul.",
      "Persoana care preia locul trebuie să îndeplinească nivelul de experiență cerut de curs.",
      "Factura se emite pe datele persoanei sau ale clinicii indicate de tine.",
    ],
  },
  {
    title: "Mutarea la o altă ediție",
    items: [
      "Poți muta înscrierea la o ediție viitoare a aceluiași curs, dacă există locuri libere.",
      "Cererea se face în scris, înainte de începerea cursului.",
    ],
  },
  {
    title: "Anularea sau modificarea de către organizator",
    items: [
      "Dacă un curs este anulat de organizator, rambursăm integral suma plătită sau îți oferim un loc la o ediție ulterioară, la alegerea ta.",
      "Dacă data sau locația se schimbă, te anunțăm pe email și poți renunța cu rambursare integrală.",
    ],
  },
  {
    title: "Cursuri online",
    items: [
      "Pentru cursurile online, dreptul de retragere se aplică în condițiile din Termeni și condiții. Odată ce ai început accesul la conținut, condițiile pot fi diferite, conform legii.",
    ],
  },
  {
    title: "Puncte de fidelitate și reduceri",
    items: [
      "La o rambursare, punctele câștigate din acea achiziție se anulează, iar punctele folosite la plată se returnează în cont.",
    ],
  },
];

export default async function Page() {
  const custom = await getLegalText("legal_rambursare");
  return (
    <LegalShell title="Politica de rambursare și transfer de loc" lead="Condițiile de retragere, transfer și rambursare pentru cursurile noastre.">
      {custom ? (
        <LegalText text={custom} />
      ) : (
        <>
          <p className="mt-6 leading-relaxed text-muted">
            Reguli generale pentru anulări, rambursări și transferul locului. Pentru situații speciale, scrie-ne și găsim o soluție.
          </p>
          <div className="mt-10 space-y-10">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-10 leading-relaxed text-muted">
            Cereri și întrebări: <a className="text-foreground underline" href={`mailto:${contact.email}`}>{contact.email}</a>, <a className="text-foreground underline" href={contact.phoneHref}>{contact.phone}</a>.
          </p>
        </>
      )}
    </LegalShell>
  );
}
