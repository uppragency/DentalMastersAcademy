import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { en } from "@/i18n/en";
import { setLocaleResolver } from "@/lib/format";
import { interpolate, localePath, type Locale } from "./config";

// One store per request. The root layout and every server action call getLocale() first,
// so tr() can stay synchronous inside server components.
const store = cache(() => ({ locale: null as Locale | null }));

export async function getLocale(): Promise<Locale> {
  const s = store();
  if (!s.locale) s.locale = (await headers()).get("x-locale") === "en" ? "en" : "ro";
  return s.locale;
}

setLocaleResolver(() => store().locale ?? "ro");

/** Locale of the current request. Only valid after getLocale() has resolved (layout, actions, metadata). */
export function loc(): Locale {
  return store().locale ?? "ro";
}

/** Translates a Romanian source string. Falls back to the Romanian text when no translation exists. */
export function tr(ro: string, vars?: Record<string, string | number>): string {
  return interpolate(loc() === "en" ? (en[ro] ?? ro) : ro, vars);
}

/** Prefixes an internal path for the current locale. */
export function lp(href: string): string {
  return localePath(href, loc());
}

/** redirect() that keeps the visitor in the current language. */
export function lredirect(href: string): never {
  return nextRedirect(lp(href));
}
