"use client";

import { useT } from "@/lib/i18n/client";
import Link from "@/components/locale-link";
import { useSyncExternalStore } from "react";

const KEY = "dma-cookies";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const read = () => {
  try { return localStorage.getItem(KEY); } catch { return "x"; }
};

export function CookieBanner() {
  const tr = useT();
  const choice = useSyncExternalStore(subscribe, read, () => "x");
  if (choice) return null;
  const save = (v: "all" | "necessary") => {
    try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ }
    listeners.forEach((l) => l());
  };
  return (
    <div role="dialog" aria-label={tr("Cookies")} className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl rounded-3xl border border-line bg-card p-5 shadow-2xl sm:left-auto sm:right-6 sm:bottom-6 sm:mx-0">
      <p className="text-sm leading-relaxed text-muted">
        {tr("Folosim cookie-uri necesare pentru autentificare și plăți, plus preferințe de afișare. Detalii în")}{" "}
        <Link href="/cookies" className="font-medium text-foreground underline underline-offset-4">{tr("Politica de cookies")}</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => save("all")} className="min-h-11 flex-1 rounded-full bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-black">{tr("Accept")}</button>
        <button type="button" onClick={() => save("necessary")} className="min-h-11 flex-1 rounded-full border border-line px-6 text-sm font-medium transition-colors hover:bg-gold-soft">{tr("Doar necesare")}</button>
      </div>
    </div>
  );
}
