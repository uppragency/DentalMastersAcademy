/**
 * Adrese de email Dental Masters Academy.
 *
 * Expeditori (nu cer căsuță poștală, doar domeniul verificat în Resend):
 *  - comenzi@  comenzi, plăți, transfer bancar, liste de așteptare, recuperare coș
 *  - cursuri@  comunicare către cursanți: pași următori, schimbări, adeverințe, materiale, recomandări
 *  - alerte@   notificări interne către echipă (rapoarte, locuri, cereri)
 *  - cont@     emailurile contului (confirmare, resetare parolă), configurat în Supabase Auth
 *
 * Căsuțe de primire (de creat ca alias care redirecționează către căsuța echipei):
 *  - contact@  mesaje generale, răspunsuri la comunicarea către cursanți
 *  - comenzi@  răspunsuri la emailurile despre comenzi (dovezi de plată)
 *  - medici@   cazuri trimise de medici
 *  - pacienti@ solicitări de evaluare de la pacienți
 *
 * Până când aliasurile există (NEXT_PUBLIC_MAIL_ALIASES_READY=true), orice adresă de primire
 * cade pe adresa de rezervă din site.ts, ca nicio cerere să nu se piardă.
 */
const DOMAIN = "dentalmasters.ro";
const BRAND = "Dental Masters Academy";

export const FALLBACK_INBOX = "dentalmastersa@gmail.com";

export type InboxName = "contact" | "comenzi" | "medici" | "pacienti";

/** Adresa la care se primesc mesaje. Folosește aliasul doar după ce a fost creat. */
export function inbox(name: InboxName): string {
  return process.env.NEXT_PUBLIC_MAIL_ALIASES_READY === "true" ? `${name}@${DOMAIN}` : FALLBACK_INBOX;
}

type Sender = "comenzi" | "cursuri" | "alerte" | "cont";

const SENDER_BY_KIND: Record<string, Sender> = {
  purchase: "comenzi",
  transfer: "comenzi",
  waitlist: "comenzi",
  recovery: "comenzi",
  earn: "comenzi",
  alert: "alerte",
  report: "alerte",
  seats: "alerte",
};

const REPLY_TO: Record<Sender, InboxName | null> = {
  comenzi: "comenzi",
  cursuri: "contact",
  alerte: null,
  cont: "contact",
};

/**
 * Expeditorul unui email. Dacă RESEND_FROM folosește domeniul dentalmasters.ro,
 * adresa se alege după tipul emailului; altfel (domeniu neverificat, test) rămâne RESEND_FROM.
 */
export function mailFrom(kind?: string): { from: string; replyTo?: string } | null {
  const base = process.env.RESEND_FROM;
  if (!base) return null;
  if (!base.toLowerCase().includes(`@${DOMAIN}`)) return { from: base };
  const sender = (kind && SENDER_BY_KIND[kind]) || "cursuri";
  const reply = REPLY_TO[sender];
  return { from: `${BRAND} <${sender}@${DOMAIN}>`, replyTo: reply ? inbox(reply) : undefined };
}
