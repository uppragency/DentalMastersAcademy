"use client";

import { useId } from "react";
import { usePathname } from "next/navigation";
import { localeNames, localePath, stripLocale, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

function Flag({ locale, size }: { locale: Locale; size: number }) {
  const id = useId();
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" width={size} height={size} className="shrink-0 rounded-full">
      <defs>
        <clipPath id={`${id}c`}><circle cx="30" cy="30" r="30" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        {locale === "ro" ? (
          <>
            <rect width="20" height="60" fill="#002B7F" />
            <rect x="20" width="20" height="60" fill="#FCD116" />
            <rect x="40" width="20" height="60" fill="#CE1126" />
          </>
        ) : (
          <>
            <rect width="60" height="60" fill="#012169" />
            <path d="M0 0L60 60M60 0L0 60" stroke="#fff" strokeWidth="10" />
            <path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" strokeWidth="5" />
            <path d="M30 0V60M0 30H60" stroke="#fff" strokeWidth="16" />
            <path d="M30 0V60M0 30H60" stroke="#C8102E" strokeWidth="9" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Switches between /path and /en/path, keeping query string and hash. Flags carry a tooltip with the language name. */
export function LanguageSwitch({ variant = "header" }: { variant?: "header" | "footer" | "mobile" }) {
  const current = useLocale();
  const pathname = usePathname() || "/";
  const base = stripLocale(pathname);
  const go = (e: React.MouseEvent<HTMLAnchorElement>, target: Locale) => {
    if (target === current) { e.preventDefault(); return; }
    e.preventDefault();
    window.location.assign(localePath(base, target) + window.location.search + window.location.hash);
  };
  const size = variant === "mobile" ? 28 : variant === "footer" ? 22 : 24;

  return (
    <div role="group" aria-label={current === "en" ? "Language" : "Limba"} className={variant === "mobile" ? "flex gap-3" : "flex items-center gap-1.5"}>
      {(["ro", "en"] as const).map((l) => {
        const active = l === current;
        return (
          <a
            key={l}
            href={localePath(base, l)}
            hrefLang={l}
            lang={l}
            aria-label={localeNames[l]}
            aria-current={active ? "true" : undefined}
            onClick={(e) => go(e, l)}
            className={[
              "group relative inline-flex items-center justify-center rounded-full transition-all",
              variant === "mobile" ? "min-h-12 gap-3 border px-5 text-base" : "size-9 hover:bg-white/10",
              variant === "mobile" ? (active ? "border-gold-bright text-white" : "border-white/20 text-white/70") : active ? "ring-2 ring-gold-bright ring-offset-2 ring-offset-ink" : "opacity-70 hover:opacity-100",
            ].join(" ")}
          >
            <Flag locale={l} size={size} />
            {variant === "mobile" ? <span>{localeNames[l]}</span> : null}
            {variant !== "mobile" ? (
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1 text-xs font-medium text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${variant === "footer" ? "bottom-full mb-2" : "top-full mt-2"}`}
              >
                {localeNames[l]}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
