import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { faqs as defaultFaqs, partners as defaultPartners } from "@/content/site";

export type Faq = { q: string; a: string };

const load = cache(async (key: string): Promise<unknown | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
});

export async function getFaqs(): Promise<Faq[]> {
  const v = await load("faqs");
  return Array.isArray(v) && v.length > 0 ? (v as Faq[]) : defaultFaqs;
}

export async function getPartners(): Promise<string[]> {
  const v = await load("partners");
  return Array.isArray(v) ? (v as string[]) : defaultPartners;
}

/** Plain text of a legal page, or null when it has not been edited in the admin. */
export async function getLegalText(key: "legal_termeni" | "legal_confidentialitate" | "legal_cookies" | "legal_rambursare"): Promise<string | null> {
  const v = await load(key);
  return typeof v === "string" && v.trim() ? v : null;
}

export function parseFaqs(text: string): Faq[] {
  return text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const [q, ...rest] = b.split("\n");
      return { q: q.trim(), a: rest.join(" ").trim() };
    })
    .filter((f) => f.q && f.a);
}
