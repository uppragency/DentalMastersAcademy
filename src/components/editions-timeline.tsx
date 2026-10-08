import Link from "next/link";
import type { Course } from "@/lib/types";
import { dayNum } from "@/lib/format";

/** Month axis of upcoming editions. */
export function EditionsTimeline({ courses, bare = false }: { courses: Pick<Course, "id" | "slug" | "title" | "starts_at">[]; bare?: boolean }) {
  const dated = courses.filter((c) => c.starts_at).sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  if (dated.length === 0) return null;
  const key = (iso: string) => new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date(iso));
  const label = (iso: string) => new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(iso));
  const groups = new Map<string, { label: string; items: typeof courses }>();
  for (const c of dated) {
    const k = key(c.starts_at!);
    if (!groups.has(k)) groups.set(k, { label: label(c.starts_at!), items: [] });
    groups.get(k)!.items.push(c);
  }
  return (
    <section aria-label="Calendar ediții" className={bare ? "" : "border-b border-line bg-card"}>
      <div className={bare ? "overflow-x-auto py-2" : "mx-auto max-w-[1680px] overflow-x-auto px-5 py-8 sm:px-8 lg:px-12 2xl:px-16"}>
        <ol className="relative flex min-w-max gap-0">
          {[...groups.values()].map((g) => (
            <li key={g.label} className="relative w-64 shrink-0 pr-6">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full border-2 border-gold bg-card" />
                <span className="h-px flex-1 bg-line" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{g.label}</p>
              <ul className="mt-3 space-y-2">
                {g.items.map((c) => (
                  <li key={c.id}>
                    <Link href={`/cursuri/${c.slug}`} className="flex items-start gap-3 rounded-2xl border border-line bg-background p-3 transition-colors hover:border-gold/60">
                      <span className="font-display text-2xl leading-none text-gold">{dayNum(c.starts_at)}</span>
                      <span className="text-sm font-medium leading-snug">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
