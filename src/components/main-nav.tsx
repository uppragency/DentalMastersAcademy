"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavCourse = { title: string; slug: string; line: string };
export type NavData = {
  founders: { name: string; slug: string }[];
  faculty: { name: string; slug: string }[];
  dma: NavCourse[];
  hosted: NavCourse[];
};

type Key = "cine" | "cursuri" | "testimoniale" | "contact";

const foundersText = "Profil profesional, competențe și arii de expertiză, rolul în cadrul DMA și o selecție de cazuri clinice documentate.";

const tile = "block h-full rounded-3xl border border-white/10 p-6 transition-colors hover:border-gold-bright/50 hover:bg-white/5";
const tileTitle = "font-display block text-2xl leading-tight";
const tileText = "mt-2 block text-sm leading-relaxed text-white/60";
const colLabel = "text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright";
const panelCls = "absolute inset-x-0 top-full border-b border-white/10 bg-ink text-white shadow-[0_40px_60px_-30px_rgba(0,0,0,.7)]";
const panelInner = "mx-auto w-full max-w-[1680px] px-12 py-10 2xl:px-16";

export function MainNav({ data }: { data: NavData }) {
  const [open, setOpen] = useState<Key | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLElement>(null);

  const show = (k: Key) => { if (timer.current) clearTimeout(timer.current); setOpen(k); };
  const hide = () => { timer.current = setTimeout(() => setOpen(null), 120); };
  const close = () => setOpen(null);

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
  const labels: Record<Key, string> = { cine: "Cine suntem", cursuri: "Cursuri și workshopuri", testimoniale: "Testimoniale", contact: "Contact" };

  const panel = (k: Key, children: React.ReactNode) => (
    <div id={`mega-${k}`} hidden={open !== k} onMouseEnter={() => show(k)} className={panelCls}>
      <div className={panelInner}>{children}</div>
    </div>
  );

  return (
    <nav ref={root} aria-label="Principal" className="hidden items-center gap-8 lg:flex xl:gap-9" onMouseLeave={hide}>
      {(Object.keys(labels) as Key[]).map((k) => (
        <div key={k} onMouseEnter={() => show(k)} className="flex items-center">
          <button type="button" aria-expanded={open === k} aria-controls={`mega-${k}`} onClick={() => setOpen(open === k ? null : k)} onFocus={() => show(k)} className={trigger}>
            {labels[k]} {chevron(k)}
          </button>
        </div>
      ))}
      <Link href="/blog" className="text-sm text-white/70 transition-colors hover:text-white" onMouseEnter={close}>Blog</Link>

      {panel("cine", (
        <ul className="grid gap-4 lg:grid-cols-5">
          <li>
            <Link href="/cine-suntem" onClick={close} className="block h-full rounded-3xl bg-gradient-to-br from-gold to-gold-bright p-6 text-ink">
              <span className={tileTitle}>Conceptul DMA</span>
              <span className="mt-2 block text-sm leading-relaxed text-ink/70">Un ecosistem dedicat educației clinice, care reunește sala de curs, radiologia, cabinetul stomatologic și laboratorul dentar într-un singur loc.</span>
            </Link>
          </li>
          {data.founders.map((f) => (
            <li key={f.slug}>
              <Link href={`/lectori/${f.slug}`} onClick={close} className={tile}>
                <span className={tileTitle}>{f.name}</span>
                <span className={tileText}>{foundersText}</span>
              </Link>
            </li>
          ))}
          <li>
            <div className={tile}>
              <Link href="/lectori" onClick={close} className={tileTitle}>Lectorii noștri</Link>
              <span className={tileText}>Fotografie, scurtă biografie, domenii de expertiză și cursurile pe care le susține fiecare lector.</span>
              <ul className="mt-3 space-y-1 text-sm">
                {data.faculty.map((t) => (
                  <li key={t.slug}><Link href={`/lectori/${t.slug}`} onClick={close} className="text-gold-bright hover:underline">{t.name}</Link></li>
                ))}
              </ul>
            </div>
          </li>
          <li>
            <Link href="/parteneri" onClick={close} className={tile}>
              <span className={tileTitle}>Partenerii noștri</span>
              <span className={tileText}>Straumann, iDentical Lab, DÜRR Dental, Invictus, G-Diff și alți parteneri.</span>
            </Link>
          </li>
        </ul>
      ))}

      {panel("cursuri", (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className={colLabel}>Cursuri DMA</p>
            <p className="mt-1 text-xs text-white/50">Susținute de Dr. Ovidiu Dumitru și Dr. Gabriel Mușețescu.</p>
            <ul className="mt-4 space-y-1">
              {data.dma.map((c) => (
                <li key={c.slug}>
                  <Link href={`/cursuri/${c.slug}`} onClick={close} className="block rounded-2xl px-3 py-2 hover:bg-white/5">
                    <span className="block text-[15px] leading-snug text-white">{c.title}</span>
                    <span className="block text-xs text-white/50">{c.line}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <p className={colLabel}>Cursuri găzduite</p>
            <ul className="mt-5 space-y-1">
              {data.hosted.map((c) => (
                <li key={c.slug}>
                  <Link href={`/cursuri/${c.slug}`} onClick={close} className="block rounded-2xl px-3 py-2 hover:bg-white/5">
                    <span className="line-clamp-2 block text-[15px] leading-snug text-white">{c.title}</span>
                    <span className="line-clamp-1 block text-xs text-white/50">{c.line}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <div className="grain relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b2a44] to-ink-2 p-7">
              <p className={colLabel}>Mentorat clinic</p>
              <p className="font-display mt-3 text-2xl leading-tight">Vino cu propriul pacient în cabinetul DMA.</p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">Beneficiază de experiența echipei noastre, cu îndrumare sau în format over-the-shoulder.</p>
              <Link href="/mentorat" onClick={close} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink hover:bg-gold-soft">Discută un caz cu echipa DMA</Link>
              <Link href="/cursuri" onClick={close} className="mt-4 block text-sm text-gold-bright hover:underline">Vezi toate cursurile</Link>
            </div>
          </div>
        </div>
      ))}

      {panel("testimoniale", (
        <ul className="grid gap-4 lg:grid-cols-3">
          {[
            { href: "/testimoniale#t-foto", title: "Galerii foto", text: "Din edițiile anterioare, pe cursuri și ediții." },
            { href: "/testimoniale#t-text", title: "Testimoniale text", text: "Cu numele participantului și cursul urmat." },
            { href: "/testimoniale#t-video", title: "Testimoniale video", text: "Impresii despre cursuri, experiența practică și interacțiunea cu lectorii." },
          ].map((a) => (
            <li key={a.href}><Link href={a.href} onClick={close} className={tile}><span className={tileTitle}>{a.title}</span><span className={tileText}>{a.text}</span></Link></li>
          ))}
        </ul>
      ))}

      {panel("contact", (
        <ul className="grid gap-4 lg:grid-cols-2">
          {[
            { href: "/contact#medici", title: "Pentru medici", text: "Ai un caz complex? Hai să îl evaluăm împreună." },
            { href: "/contact#pacienti", title: "Pentru pacienți", text: "Ai nevoie de un tratament? Începe cu o evaluare." },
          ].map((a) => (
            <li key={a.href}><Link href={a.href} onClick={close} className={tile}><span className={tileTitle}>{a.title}</span><span className={tileText}>{a.text}</span></Link></li>
          ))}
        </ul>
      ))}
    </nav>
  );
}
