"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EditionsTimeline } from "@/components/editions-timeline";
import type { Course } from "@/lib/types";

type Key = "categorie" | "perioada" | "format" | "calendar";
type Props = {
  categories: { slug: string; name: string }[];
  categorie?: string;
  format?: string;
  perioada: string;
  upcoming: Pick<Course, "id" | "slug" | "title" | "starts_at">[];
};

const icons: Record<Key, ReactNode> = {
  categorie: <path d="M4 6h16M4 12h16M4 18h10" />,
  perioada: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  format: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
};

const formatNames: Record<string, string> = { physical: "Fizic", online: "Online", hybrid: "Hibrid" };
const periodNames: Record<string, string> = { viitoare: "Înscrieri deschise", incheiate: "Înscrieri închise" };

export function CourseFilters({ categories, categorie, format, perioada, upcoming }: Props) {
  const [open, setOpen] = useState<Key | null>(null);

  const href = (o: { c?: string; f?: string; p?: string }) => {
    const params = new URLSearchParams();
    if (o.c) params.set("categorie", o.c);
    if (o.f) params.set("format", o.f);
    if (o.p) params.set("perioada", o.p);
    const qs = params.toString();
    return qs ? `/cursuri?${qs}` : "/cursuri";
  };
  const cur = { c: categorie, f: format, p: perioada || undefined };
  const chip = (active: boolean) =>
    `rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${active ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:border-foreground/30 hover:text-foreground"}`;

  const tabs: { key: Key; label: string; value?: string }[] = [
    { key: "categorie", label: "Specializare", value: categories.find((c) => c.slug === categorie)?.name },
    { key: "perioada", label: "Perioadă", value: periodNames[perioada] },
    { key: "format", label: "Format", value: format ? formatNames[format] : undefined },
    { key: "calendar", label: "Calendar ediții" },
  ];
  const active = [categorie, perioada, format].filter(Boolean).length;

  return (
    <div className="rounded-[2rem] border border-line bg-card p-2">
      <div role="tablist" aria-label="Filtre cursuri" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((t) => {
          const isOpen = open === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isOpen}
              aria-controls={`filter-${t.key}`}
              onClick={() => setOpen(isOpen ? null : t.key)}
              className={`flex min-h-14 items-center gap-3 rounded-3xl px-4 text-left transition-colors ${isOpen ? "bg-ink text-white" : "hover:bg-background"}`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isOpen ? "bg-white/15" : t.value ? "bg-gold text-white" : "bg-gold-soft text-gold"}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[t.key]}</svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.label}</span>
                {t.value ? <span className={`block truncate text-xs ${isOpen ? "text-gold-bright" : "text-gold"}`}>{t.value}</span> : null}
              </span>
              <svg aria-hidden="true" viewBox="0 0 12 12" className={`hidden size-3 shrink-0 transition-transform sm:block ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.500l4 4 4-4" /></svg>
            </button>
          );
        })}
      </div>

      {open ? (
        <div id={`filter-${open}`} role="tabpanel" className="px-4 pb-5 pt-5 sm:px-6">
          {open === "categorie" ? (
            <nav aria-label="Filtrare după specializare" className="flex flex-wrap gap-2">
              <Link href={href({ ...cur, c: undefined })} className={chip(!categorie)}>Toate specializările</Link>
              {categories.map((c) => <Link key={c.slug} href={href({ ...cur, c: c.slug })} className={chip(categorie === c.slug)}>{c.name}</Link>)}
            </nav>
          ) : null}
          {open === "perioada" ? (
            <nav aria-label="Filtrare după perioadă" className="flex flex-wrap gap-2">
              <Link href={href({ ...cur, p: undefined })} className={chip(!perioada)}>Toate</Link>
              <Link href={href({ ...cur, p: "viitoare" })} className={chip(perioada === "viitoare")}>Înscrieri deschise</Link>
              <Link href={href({ ...cur, p: "incheiate" })} className={chip(perioada === "incheiate")}>Înscrieri închise</Link>
            </nav>
          ) : null}
          {open === "format" ? (
            <nav aria-label="Filtrare după format" className="flex flex-wrap gap-2">
              <Link href={href({ ...cur, f: undefined })} className={chip(!format)}>Orice format</Link>
              {Object.entries(formatNames).map(([k, v]) => <Link key={k} href={href({ ...cur, f: k })} className={chip(format === k)}>{v}</Link>)}
            </nav>
          ) : null}
          {open === "calendar" ? (
            upcoming.length > 0 ? <EditionsTimeline courses={upcoming} bare /> : <p className="text-sm text-muted">Nu există ediții programate momentan.</p>
          ) : null}
        </div>
      ) : null}

      {active > 0 ? (
        <div className="px-4 pb-3 pt-1 sm:px-6">
          <Link href="/cursuri" className="text-xs font-medium text-gold underline underline-offset-4">Șterge filtrele ({active})</Link>
        </div>
      ) : null}
    </div>
  );
}
