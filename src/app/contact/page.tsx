import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { contact } from "@/content/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const items = [
    { k: "Adresă", v: contact.address, href: undefined },
    { k: "Telefon", v: contact.phone, href: contact.phoneHref },
    { k: "Email", v: contact.email, href: `mailto:${contact.email}` },
    { k: "Social", v: contact.social, href: contact.socialHref },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Hai să <span className="text-gold-sheen">vorbim.</span></>} lead="Pentru întrebări despre cursuri, înscrieri sau plată, completează formularul și îți răspundem rapid." />
      <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-12">
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
        <div className="rounded-[2rem] border border-line bg-card p-8 sm:p-10 lg:col-span-7"><ContactForm /></div>
      </Container>
    </>
  );
}
