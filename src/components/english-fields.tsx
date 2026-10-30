import { enText, type EnField, type Translations } from "@/lib/translations";

const base = "w-full rounded-xl border border-line bg-card px-4 text-base outline-none focus:border-gold";

/** "English version" block for admin forms. Empty fields fall back to the Romanian text on the site. */
export function EnglishFields({ fields, translations }: { fields: EnField[]; translations?: Translations }) {
  const en = translations?.en ?? {};
  return (
    <details className="rounded-2xl border border-line p-4" open={Object.keys(en).length > 0 ? false : undefined}>
      <summary className="cursor-pointer text-sm font-medium">Versiune în engleză (EN)</summary>
      <p className="mt-2 text-xs text-muted">Se afișează pe /en. Câmpurile goale rămân în română.</p>
      <div className="mt-4 space-y-4">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`en_${f.name}`} className="mb-1.5 block text-sm font-medium">{f.label}</label>
            {f.type === "text" ? (
              <input id={`en_${f.name}`} name={`en_${f.name}`} defaultValue={enText(en[f.name], f.type)} className={`${base} min-h-12`} />
            ) : (
              <textarea id={`en_${f.name}`} name={`en_${f.name}`} rows={f.rows ?? 4} defaultValue={enText(en[f.name], f.type)} className={`${base} py-3`} />
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
