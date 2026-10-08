"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileMenu({ items, signedIn }: { items: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
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
        className={`fixed inset-x-0 top-[72px] bottom-0 z-40 bg-ink px-6 py-8 transition-all duration-500 ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <nav aria-label="Principal mobil" className="flex flex-col">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
              className={`font-display border-b border-white/10 py-5 text-3xl text-white transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              {item.label}
            </Link>
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
  );
}
