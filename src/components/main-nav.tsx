"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavData = {
  categories: { name: string; slug: string }[];
  courses: { title: string; slug: string; date: string; price: string }[];
};

const about = [
  { href: "/lectori", title: "Lectori", text: "Clinicienii care predau și experiența lor." },
  { href: "/despre#concept", title: "Concept", text: "Cum arată academia: săli, tehnologie, grupe mici." },
  { href: "/testimoniale", title: "Testimoniale", text: "Ce spun medicii care au participat." },
];

type Key = "cursuri" | "despre";

export function MainNav({ data }: { data: NavData }) {
  const [open, setOpen] = useState<Key | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLElement>(null);

  const show = (k: Key) => { if (timer.current) clearTimeout(timer.current); setOpen(k); };
  const hide = () => { timer.current = setTimeout(() => setOpen(null), 120); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, []);

  const trigger = "inline-flex min-h-11 items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white aria-expanded:text-white";
  const chevron = (k: Key) => (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 transition-transform ${open === k ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.500l4 4 4-4" /></svg>
  );
  const close = () => setOpen(null);

  return (
    <nav ref={root} aria-label="Principal" className="hidden items-center gap-9 lg:flex" onMouseLeave={hide}>
      {(["cursuri", "despre"] as const).map((k) => (
        <div key={k} onMouseEnter={() => show(k)} className="flex items-center">
          <button type="button" aria-expanded={open === k} aria-controls={`mega-${k}`} onClick={() => setOpen(open === k ? null : k)} onFocus={() => show(k)} className={trigger}>
            {k === "cursuri" ? "Cursuri" : "Despre noi"} {chevron(k)}
          </button>
        </div>
      ))}
      <Link href="/blog" className="text-sm text-white/70 transition-colors hover:text-white" onMouseEnter={close}>Blog</Link>
      <Link href="/contact" className="text-sm text-white/70 transition-colors hover:text-white" onMouseEnter={close}>Contact</Link>

      <div
        id="mega-cursuri"
        hidden={open !== "cursuri"}
        onMouseEnter={() => show("cursuri")}
        className="absolute inset-x-0 top-full border-b border-white/10 bg-ink text-white shadow-[0_40px_60px_-30px_rgba(0,0,0,.7)]"
      >
        <div className="mx-auto grid w-full max-w-[1680px] gap-10 px-12 py-10 2xl:px-16 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Specializări</p>
            <ul className="mt-4 space-y-1">
              {data.categories.map((c) => (
                <li key={c.slug}><Link href={`/cursuri?categorie=${c.slug}`} onClick={close} className="block rounded-xl px-3 py-2 text-[15px] text-white/80 hover:bg-white/5 hover:text-white">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Edițiile următoare</p>
            <ul className="mt-4 space-y-2">
              {data.courses.map((c) => (
                <li key={c.slug}>
                  <Link href={`/cursuri/${c.slug}`} onClick={close} className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 px-4 py-3 hover:border-gold-bright/50 hover:bg-white/5">
                    <span><span className="font-display block text-lg leading-tight">{c.title}</span><span className="text-xs text-white/55">{c.date}</span></span>
                    <span className="shrink-0 text-sm text-gold-bright">{c.price}</span>
                  </Link>
                </li>
              ))}
              {data.courses.length === 0 ? <li className="text-sm text-white/55">Edițiile vor fi anunțate în curând.</li> : null}
            </ul>
          </div>
          <div className="lg:col-span-4">
            <div className="grain relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b2a44] to-ink-2 p-8">
              <p className="font-display text-3xl leading-tight">Toate cursurile, într-un singur loc.</p>
              <p className="mt-3 text-sm text-white/60">Filtrează după specializare, format sau perioadă și vezi calendarul edițiilor.</p>
              <Link href="/cursuri" onClick={close} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink hover:bg-gold-soft">Vezi catalogul</Link>
            </div>
          </div>
        </div>
      </div>

      <div
        id="mega-despre"
        hidden={open !== "despre"}
        onMouseEnter={() => show("despre")}
        className="absolute inset-x-0 top-full border-b border-white/10 bg-ink text-white shadow-[0_40px_60px_-30px_rgba(0,0,0,.7)]"
      >
        <div className="mx-auto w-full max-w-[1680px] px-12 py-10 2xl:px-16">
          <ul className="grid gap-4 lg:grid-cols-4">
            <li>
              <Link href="/despre" onClick={close} className="block h-full rounded-3xl bg-gradient-to-br from-gold to-gold-bright p-6 text-ink">
                <span className="font-display block text-2xl leading-tight">Despre noi</span>
                <span className="mt-2 block text-sm text-ink/70">Povestea academiei și echipa din spatele ei.</span>
              </Link>
            </li>
            {about.map((a) => (
              <li key={a.href}>
                <Link href={a.href} onClick={close} className="block h-full rounded-3xl border border-white/10 p-6 hover:border-gold-bright/50 hover:bg-white/5">
                  <span className="font-display block text-2xl leading-tight">{a.title}</span>
                  <span className="mt-2 block text-sm text-white/60">{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
