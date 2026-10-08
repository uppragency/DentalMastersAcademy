import type { ReactNode } from "react";
import type { LegalDoc } from "@/content/legal";

/** Full-width page shell for legal pages; the reading column stays narrow inside it. */
export function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-14 sm:px-8 sm:py-24 lg:px-12 lg:py-28 2xl:px-16">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="max-w-4xl">{children}</div>
    </div>
  );
}

/** Built-in legal text shown until an admin saves a custom version. */
export function DefaultLegal({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <p className="mt-3 text-sm text-muted">Ultima actualizare: {doc.updated}</p>
      <p className="mt-6 leading-relaxed text-muted">{doc.intro}</p>
      <div className="mt-8 space-y-8">
        {doc.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted">{s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
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
