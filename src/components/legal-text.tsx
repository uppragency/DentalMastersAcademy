import { tr } from "@/lib/i18n/server";
import type { ReactNode } from "react";
import type { LegalDoc } from "@/content/legal";
import { PageHero } from "@/components/page-hero";
import { company, contact } from "@/content/site";

/** Full-width page shell for legal pages; the reading column stays narrow inside it. */
export function LegalShell({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow={tr("Legal")} title={title} lead={lead} />
      <div className="mx-auto w-full max-w-[1680px] px-5 py-14 sm:px-8 sm:py-24 lg:px-12 lg:py-28 2xl:px-16">
        <div className="max-w-4xl [&>*:first-child]:mt-0">{children}</div>
      </div>
    </>
  );
}

/** Built-in legal text shown until an admin saves a custom version. */
export function DefaultLegal({ doc }: { doc: LegalDoc }) {
  const vars = {
    brand: company.brand,
    email: contact.email,
    phone: contact.phone,
    operator: tr("{name}, CUI {cui}, Nr. Reg. Com. {regCom}, EUID {euid}, cu sediul în {address}", { name: company.name, cui: company.cui, regCom: company.regCom, euid: company.euid, address: company.address }),
  };
  return (
    <>
      <p className="mt-3 text-sm text-muted">{tr("Ultima actualizare:")}{" "}{tr(doc.updated)}</p>
      <p className="mt-6 leading-relaxed text-muted">{tr(doc.intro, vars)}</p>
      <div className="mt-8 space-y-8">
        {doc.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold">{tr(s.title)}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted">{s.paragraphs.map((p, i) => <p key={i}>{tr(p, vars)}</p>)}</div>
          </section>
        ))}
      </div>
    </>
  );
}

/** Renders admin-edited legal text: "## " starts a heading, blank lines separate paragraphs. */
export function LegalText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="mt-8 space-y-4 leading-relaxed text-muted">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i} className="pt-4 text-xl font-semibold text-foreground">{b.slice(3)}</h2>
        ) : (
          <p key={i} className="whitespace-pre-line">{b}</p>
        ),
      )}
    </div>
  );
}
