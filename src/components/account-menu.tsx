"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Tier } from "@/lib/types";

const pill: Record<Tier, string> = {
  standard: "border border-white/20 text-white/70",
  gold: "bg-gradient-to-r from-gold-bright to-gold text-ink font-bold",
  platinum: "bg-gradient-to-r from-[#eef1f6] to-[#a3aec0] text-ink font-bold",
};

export function AccountMenu({ name, tier, tierLabel }: { name: string; tier: Tier; tierLabel: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, []);

  const item = "flex min-h-11 items-center justify-between rounded-xl px-3 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white";
  const close = () => setOpen(false);

  return (
    <div ref={root} className="relative hidden sm:block" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
      >
        Contul meu
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.500l4 4 4-4" /></svg>
      </button>
      <div hidden={!open} role="menu" className="absolute right-0 top-full z-50 w-72 pt-2">
        <div className="rounded-3xl border border-white/10 bg-ink p-3 text-white shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
          <Link href="/cont" onClick={close} className="block rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
            <p className="truncate font-semibold">{name}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${pill[tier]}`}>{tierLabel}</span>
          </Link>
          <ul className="mt-2">
            <li><Link role="menuitem" href="/cont/cursuri" onClick={close} className={item}>Cursurile mele <span aria-hidden="true">→</span></Link></li>
            <li><Link role="menuitem" href="/cont/profil" onClick={close} className={item}>Profil și securitate <span aria-hidden="true">→</span></Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
