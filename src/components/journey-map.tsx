import Link from "next/link";
import type { Course } from "@/lib/types";

export type JourneyNode = { course: Course; state: "done" | "booked" | "open" };

export function JourneyMap({ nodes }: { nodes: JourneyNode[] }) {
  if (nodes.length === 0) return null;
  const done = nodes.filter((n) => n.state === "done").length;
  return (
    <section aria-labelledby="journey-title" className="rounded-[2rem] border border-line bg-card p-8 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Parcursul tău</p>
          <h2 id="journey-title" className="font-display mt-2 text-3xl">Drumul prin academie</h2>
        </div>
        <p className="text-sm text-muted">{done} din {nodes.length} parcurse</p>
      </div>
      <ol className="mt-8 grid gap-0 sm:grid-cols-2 lg:flex lg:gap-0">
        {nodes.map((n, i) => (
          <li key={n.course.id} className="relative flex-1 pb-6 pl-10 lg:pb-0 lg:pl-0 lg:pt-10">
            <span aria-hidden="true" className={`absolute left-0 top-0 flex size-7 items-center justify-center rounded-full text-xs font-bold lg:left-0 ${n.state === "done" ? "bg-gold text-white" : n.state === "booked" ? "border-2 border-gold bg-card text-gold" : "border-2 border-line bg-card text-muted"}`}>
              {n.state === "done" ? "✓" : i + 1}
            </span>
            {i < nodes.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-3.5 top-7 w-px bg-line lg:bottom-auto lg:left-7 lg:right-0 lg:top-3.5 lg:h-px lg:w-auto" /> : null}
            <Link href={n.state === "open" ? `/cursuri/${n.course.slug}` : `/cont/cursuri/${n.course.slug}`} className="block rounded-2xl pr-4 hover:text-gold">
              <span className="block text-sm font-medium leading-snug">{n.course.title}</span>
              <span className="mt-1 block text-xs text-muted">{n.state === "done" ? "Parcurs" : n.state === "booked" ? "Înscris" : "Disponibil"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Badges({ courses, gold }: { courses: number; gold: boolean }) {
  const list = [
    { label: "Cursant", on: courses >= 1, hint: "Prima înscriere la un curs" },
    { label: "Master în curs", on: courses >= 2, hint: "Cel puțin două cursuri" },
    { label: "Gold", on: gold, hint: "Membru al programului Gold" },
  ];
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Insigne">
      {list.map((b) => (
        <li key={b.label} title={b.hint} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${b.on ? "bg-gradient-to-r from-gold-bright to-gold text-ink" : "border border-dashed border-line text-muted"}`}>
          {b.label}
        </li>
      ))}
    </ul>
  );
}
