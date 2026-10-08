"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavGroup = { label: string; items: { href: string; label: string }[] };

function Search() {
  return (
    <form action="/admin/cauta" role="search">
      <input name="q" type="search" placeholder="Caută email, nume, comandă" aria-label="Căutare în administrare" className="min-h-11 w-full rounded-full border border-line bg-background px-5 text-sm outline-none focus:border-gold" />
    </form>
  );
}

function Links({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Administrare" className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} onClick={onNavigate} aria-current={active(i.href) ? "page" : undefined} className={`flex min-h-10 items-center rounded-xl px-3 text-sm transition-colors ${active(i.href) ? "bg-ink font-medium text-white" : "text-muted hover:bg-card hover:text-foreground"}`}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const current = groups.flatMap((g) => g.items).filter((i) => (i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <div className="mb-6"><Search /></div>
        <Links groups={groups} />
      </aside>

      {/* Mobile: icon that opens the menu */}
      <div className="flex items-center gap-3 lg:hidden">
        <button type="button" aria-expanded={open} aria-controls="admin-drawer" aria-label="Deschide meniul de administrare" onClick={() => setOpen(true)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
        </button>
        <span className="truncate text-sm font-medium">{current?.label ?? "Administrare"}</span>
      </div>
      <div id="admin-drawer" className={`fixed inset-0 z-[70] lg:hidden ${open ? "visible" : "invisible"}`}>
        <button type="button" aria-label="Închide meniul" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-y-0 left-0 w-[85vw] max-w-xs overflow-y-auto overscroll-contain bg-background p-5 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-lg font-semibold">Administrare</p>
            <button type="button" aria-label="Închide meniul" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full hover:bg-card">
              <span className="relative block size-5"><span className="absolute left-0 top-1/2 h-px w-5 rotate-45 bg-current" /><span className="absolute left-0 top-1/2 h-px w-5 -rotate-45 bg-current" /></span>
            </button>
          </div>
          <div className="mb-6"><Search /></div>
          <Links groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
