"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Hit = { type: "curs" | "lector" | "articol"; title: string; href: string; sub?: string };

export function SearchDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.showModal();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setHits((await res.json()).hits as Hit[]);
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const close = () => ref.current?.close();
  const shown = q.trim().length < 2 ? null : hits;

  return (
    <>
      <button
        type="button"
        onClick={() => { ref.current?.showModal(); inputRef.current?.focus(); }}
        aria-label="Caută"
        className="flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.500 4.500" /></svg>
      </button>
      <dialog
        ref={ref}
        aria-label="Căutare"
        onClick={(e) => e.target === ref.current && close()}
        className="m-auto mt-20 w-[min(36rem,calc(100vw-2rem))] rounded-[2rem] border border-line bg-card p-0 text-foreground shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:mt-24"
      >
        <div className="flex items-center gap-3 border-b border-line px-6">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.500 4.500" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută cursuri, lectori, articole"
            aria-label="Termen de căutare"
            className="min-h-16 w-full bg-transparent text-base outline-none"
          />
          <button type="button" onClick={close} className="rounded-full px-3 py-1.5 text-xs text-muted hover:bg-background">Esc</button>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto">
          {shown === null ? (
            <p className="p-8 text-center text-sm text-muted">Scrie cel puțin 2 caractere.</p>
          ) : shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Niciun rezultat pentru „{q.trim()}”.</p>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((h) => (
                <li key={h.type + h.href}>
                  <Link href={h.href} onClick={close} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-background">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{h.title}</span>{h.sub ? <span className="block truncate text-xs text-muted">{h.sub}</span> : null}</span>
                    <span className="shrink-0 rounded-full bg-gold-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold">{h.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
