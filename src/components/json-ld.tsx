/** Renders one or more JSON-LD blocks. `<` is escaped so content cannot close the script tag. */
export function JsonLd({ data }: { data: (object | null | undefined)[] }) {
  return (
    <>
      {data.filter(Boolean).map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
