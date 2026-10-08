import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { getCurrentProfile, getMyEnrollments } from "@/lib/data";
import { formatDate, formatLabels } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Cursurile mele", robots: { index: false } };

const sourceLabel = { purchase: "Achiziționat", gold_free: "Acces Gold", admin: "Acordat" } as const;

export default async function MyCourses({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const profile = (await getCurrentProfile())!;
  const all = await getMyEnrollments(profile.id);
  const now = nowMs();
  const isPast = (iso: string | null) => Boolean(iso && new Date(iso).getTime() < now);

  const active = tab === "viitoare" || tab === "incheiate" ? tab : "toate";
  const rows = all.filter((e) => {
    if (!e.courses) return false;
    if (active === "viitoare") return !isPast(e.courses.starts_at);
    if (active === "incheiate") return isPast(e.courses.starts_at);
    return true;
  });

  const tabs = [
    { key: "toate", label: "Toate" },
    { key: "viitoare", label: "Viitoare" },
    { key: "incheiate", label: "Încheiate" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Cursurile mele</h1>
      <nav aria-label="Filtrare cursuri" className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "toate" ? "/cont/cursuri" : `/cont/cursuri?tab=${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              active === t.key ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-card p-6">
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug">{e.courses!.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(e.courses!.starts_at)} · {formatLabels[e.courses!.format]} · {sourceLabel[e.source]}
                </p>
              </div>
              <ButtonLink href={`/cont/cursuri/${e.courses!.slug}`}>Accesează</ButtonLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-12 text-center text-muted">
          Nu există cursuri în această listă. <Link href="/cursuri" className="font-medium text-foreground underline underline-offset-4">Vezi catalogul</Link>
        </p>
      )}
    </div>
  );
}
