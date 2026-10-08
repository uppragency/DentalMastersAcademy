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
