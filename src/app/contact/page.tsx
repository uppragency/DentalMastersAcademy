import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { LocationMap } from "@/components/location-map";
import { ContactForm } from "@/components/contact-form";
import { CaseForm } from "@/components/case-form";
import { PageHero } from "@/components/page-hero";
import { contact } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Contact"), description: tr("Contactează Dental Masters Academy: telefon, email, adresa din București și program. Răspundem la întrebări despre cursuri, înscriere și plată.") };
}

export default function ContactPage() {
  const items = [
    { k: tr("Adresă"), v: contact.address, href: undefined },
    { k: tr("Telefon"), v: contact.phone, href: contact.phoneHref },
    { k: tr("Email"), v: contact.email, href: `mailto:${contact.email}` },
    { k: tr("Social"), v: contact.social, href: contact.socialHref },
  ];
  return (
    <>
      <PageHero eyebrow={tr("Contact")} title={<>{tr("Hai să")}{" "}<span className="text-gold-sheen">{tr("vorbim.")}</span></>} lead={tr("Ești medic sau pacient? Alege formularul potrivit. Pentru întrebări generale, folosește formularul de la finalul paginii.")} />
      <Container className="grid gap-6 py-16 sm:py-24 lg:grid-cols-2">
        <section id="medici" className="scroll-mt-28 rounded-[2rem] border border-line bg-card p-8 sm:p-10" aria-labelledby="medici-title">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{tr("Pentru medici")}</p>
          <h2 id="medici-title" className="font-display mt-3 text-3xl leading-tight">{tr("Ai un caz complex? Hai să îl evaluăm împreună.")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{tr("Trimite-ne detaliile cazului și investigațiile disponibile: scanări intraorale, radiografii sau CBCT. Echipa noastră va analiza informațiile pentru a discuta opțiunile de colaborare, inclusiv posibilitatea de a asista la intervenție în format over-the-shoulder.")}</p>
          <div className="mt-8"><CaseForm kind="doctor" /></div>
        </section>
        <section id="pacienti" className="scroll-mt-28 rounded-[2rem] border border-line bg-card p-8 sm:p-10" aria-labelledby="pacienti-title">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{tr("Pentru pacienți")}</p>
          <h2 id="pacienti-title" className="font-display mt-3 text-3xl leading-tight">{tr("Ai nevoie de un tratament? Începe cu o evaluare.")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{tr("Spune-ne cu ce problemă te confrunți și atașează investigațiile pe care le ai. Echipa noastră te va contacta pentru a stabili următorii pași către o consultație și posibilitatea unui tratament realizat de experții noștri.")}</p>
          <div className="mt-8"><CaseForm kind="patient" /></div>
        </section>
      </Container>
      <Container className="grid gap-12 pb-16 sm:pb-24 lg:grid-cols-12">
        <dl className="space-y-8 lg:col-span-5">
          {items.map((i) => (
            <div key={i.k} className="border-b border-line pb-6">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{i.k}</dt>
              <dd className="font-display mt-2 break-words text-2xl">
                {i.href ? <a className="transition-colors hover:text-gold" href={i.href} {...(i.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{i.v}</a> : i.v}
              </dd>
            </div>
          ))}
        </dl>
        <div className="rounded-[2rem] border border-line bg-card p-8 sm:p-10 lg:col-span-7">
          <h2 className="font-display mb-6 text-2xl">{tr("Altă întrebare")}</h2>
          <ContactForm />
        </div>
      </Container>
      <Container className="pb-24"><LocationMap /></Container>
    </>
  );
}
