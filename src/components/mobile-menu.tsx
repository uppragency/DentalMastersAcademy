"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileMenu({ items, signedIn }: { items: { href: string; label: string; children?: { href: string; label: string }[] }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    // Blochează scroll-ul paginii fără a modifica body (pe iOS, body overflow/position mută headerul sticky).
    const onTouch = (e: TouchEvent) => {
      if (el && el.scrollHeight <= el.clientHeight) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    el?.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el?.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Închide meniul" : "Deschide meniul"}
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
      >
        <span className="relative block h-3.5 w-5">
          <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      <div
        id="mobile-nav"
        ref={panel}
        className={`fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-ink transition-all duration-500 ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5 sm:px-8">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Dental Masters Academy, prima pagină">
            <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-bright to-gold font-display text-lg font-semibold text-ink">D</span>
            <span className="text-[15px] font-semibold leading-none tracking-tight text-white">
              Dental Masters<span className="block pt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-gold-bright">Academy</span>
            </span>
          </Link>
          <button type="button" aria-label="Închide meniul" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
            <span className="relative block size-5">
              <span className="absolute left-0 top-1/2 h-px w-5 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-5 -rotate-45 bg-current" />
            </span>
          </button>
        </div>
        <div className="px-6 py-8">
        <nav aria-label="Principal mobil" className="flex flex-col">
          {items.map((item, i) => (
            <div key={item.label} style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }} className={`border-b border-white/10 py-4 transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <Link href={item.href} onClick={() => setOpen(false)} className="font-display block py-1 text-3xl text-white">{item.label}</Link>
              {item.children ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.children.map((c) => (
                    <li key={c.href + c.label}><Link href={c.href} onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm text-white/75 hover:border-gold-bright hover:text-white">{c.label}</Link></li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </nav>
        <Link
          href={signedIn ? "/cont" : "/autentificare"}
          onClick={() => setOpen(false)}
          className="mt-8 flex min-h-12 items-center justify-center rounded-full bg-gold-bright text-base font-semibold text-ink"
        >
          {signedIn ? "Contul meu" : "Intră în cont"}
        </Link>
        </div>
      </div>
    </div>
  );
}
