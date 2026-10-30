export const locales = ["ro", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ro";
export const localeNames: Record<Locale, string> = { ro: "Română", en: "English" };

// Paths that are never prefixed: API, auth callbacks, admin (Romanian only), short links and static files.
const unprefixed = ["/api", "/auth", "/admin", "/r/", "/_next"];

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "ro" || v === "en";
}

/** Adds the /en prefix to an internal absolute path. External links, hashes and files are returned unchanged. */
export function localePath(href: string, locale: Locale): string {
  if (locale === defaultLocale) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const path = href.split(/[?#]/)[0]!;
  if (path === "/en" || path.startsWith("/en/")) return href;
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return href;
  if (unprefixed.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`))) return href;
  return href === "/" ? "/en" : `/en${href}`;
}

/** Removes the /en prefix from a browser pathname. */
export function stripLocale(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
