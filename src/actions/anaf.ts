"use server";

export type CuiLookup = { ok: true; name: string; reg_com: string; address: string; city: string; county: string } | { ok: false; message: string };

const title = (s: string) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
const clean = (s: unknown) => (typeof s === "string" ? s.trim() : "");

/** Looks up a company in ANAF's public VAT registry (no credentials needed) to prefill billing details. */
export async function lookupCui(raw: string): Promise<CuiLookup> {
  const digits = raw.toUpperCase().replace(/^RO/, "").replace(/\D/g, "");
  if (digits.length < 2 || digits.length > 10) return { ok: false, message: "Introdu un CUI valid." };
  try {
    const res = await fetch("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ cui: Number(digits), data: new Date().toISOString().slice(0, 10) }]),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, message: "Serviciul ANAF nu răspunde acum. Completează datele manual." };
    const json = (await res.json()) as { found?: { date_generale?: Record<string, unknown>; adresa_sediu_social?: Record<string, unknown> }[] };
    const hit = json.found?.[0];
    const g = hit?.date_generale;
    if (!g) return { ok: false, message: "Nu am găsit firma după acest CUI. Verifică numărul sau completează manual." };
    const s = hit?.adresa_sediu_social ?? {};
    const street = [clean(s.sdenumire_Strada), clean(s.snumar_Strada) ? `nr. ${clean(s.snumar_Strada)}` : ""].filter(Boolean).join(" ");
    const address = street ? title(street) : title(clean(g.adresa));
    const county = clean(s.sdenumire_Judet);
    const locality = clean(s.sdenumire_Localitate);
    const bucharest = /BUCURE/i.test(county);
    const sector = /sector\s*(\d)/i.exec(locality)?.[1];
    return {
      ok: true,
      name: clean(g.denumire),
      reg_com: clean(g.nrRegCom),
      address,
      city: bucharest ? "București" : title(locality.replace(/^(Municipiul|Oraș|Orasul|Comuna)\s+/i, "")),
      county: bucharest ? (sector ? `Sector ${sector}` : "București") : title(county.replace(/^(Județul|Judetul)\s+/i, "")),
    };
  } catch {
    return { ok: false, message: "Serviciul ANAF nu răspunde acum. Completează datele manual." };
  }
}
