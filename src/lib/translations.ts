export type EnField = { name: string; label: string; type: "text" | "area" | "lines" | "sections" | "faqs"; rows?: number };
export type Translations = { en?: Record<string, unknown> } | null | undefined;

const blocks = (v: string) =>
  v.split(/\n\s*\n/).map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean)).filter((b) => b.length > 0);

/** Text shown in the admin form for a stored English value. */
export function enText(value: unknown, type: EnField["type"]): string {
  if (value == null) return "";
  if (type === "lines") return Array.isArray(value) ? value.join("\n") : "";
  if (type === "sections")
    return Array.isArray(value) ? (value as { title: string; items: string[] }[]).map((s) => [s.title, ...s.items.map((i) => `- ${i}`)].join("\n")).join("\n\n") : "";
  if (type === "faqs") return Array.isArray(value) ? (value as { q: string; a: string }[]).map((f) => `${f.q}\n${f.a}`).join("\n\n") : "";
  return typeof value === "string" ? value : "";
}

/** Reads the en_<field> inputs of a form into translations.en, keeping any keys the form does not manage. */
export function readEnglish(formData: FormData, fields: EnField[], prev: Translations): Record<string, unknown> {
  const en: Record<string, unknown> = { ...(prev?.en ?? {}) };
  for (const f of fields) {
    const raw = formData.get(`en_${f.name}`);
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) {
      delete en[f.name];
      continue;
    }
    if (f.type === "lines") en[f.name] = v.split("\n").map((l) => l.trim()).filter(Boolean);
    else if (f.type === "sections")
      en[f.name] = blocks(v).map(([title, ...items]) => ({ title: title!, items: items.map((i) => i.replace(/^[-•]\s*/, "")) }));
    else if (f.type === "faqs") en[f.name] = blocks(v).filter((b) => b.length >= 2).map(([q, ...a]) => ({ q: q!, a: a.join(" ") }));
    else en[f.name] = v;
  }
  return { ...(prev ?? {}), en };
}

export const courseEnFields: EnField[] = [
  { name: "title", label: "Titlu (EN)", type: "text" },
  { name: "summary", label: "Rezumat (EN)", type: "area", rows: 2 },
  { name: "description", label: "Descriere (EN)", type: "area", rows: 6 },
  { name: "outcomes", label: "Ce vei învăța (EN, câte un punct pe rând)", type: "lines", rows: 5 },
  { name: "audience", label: "Pentru cine este (EN, câte un punct pe rând)", type: "lines", rows: 4 },
  { name: "sections", label: "Programa structurată (EN, același format ca în română)", type: "sections", rows: 8 },
  { name: "faqs", label: "Întrebări frecvente (EN, același format ca în română)", type: "faqs", rows: 6 },
  { name: "location", label: "Locație (EN)", type: "text" },
  { name: "parking_info", label: "Parcare și acces (EN)", type: "text" },
  { name: "bring_info", label: "Ce să aducă participanții (EN)", type: "text" },
];
export const trainerEnFields: EnField[] = [
  { name: "role", label: "Rol (EN)", type: "area", rows: 2 },
  { name: "bio", label: "Biografie (EN)", type: "area", rows: 5 },
  { name: "points", label: "Puncte cheie (EN, câte unul pe rând)", type: "lines", rows: 4 },
  { name: "expertise", label: "Arii de expertiză (EN, câte una pe rând)", type: "lines", rows: 4 },
  { name: "dma_role", label: "Rolul în DMA (EN)", type: "area", rows: 4 },
];
export const postEnFields: EnField[] = [
  { name: "title", label: "Titlu (EN)", type: "text" },
  { name: "excerpt", label: "Rezumat (EN)", type: "area", rows: 2 },
  { name: "body", label: "Text (EN)", type: "area", rows: 14 },
];
export const partnerEnFields: EnField[] = [{ name: "description", label: "Descriere (EN)", type: "area", rows: 2 }];
