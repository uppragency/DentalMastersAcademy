import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Adeverințe", robots: { index: false } };

type Row = { id: string; courses: { slug: string; title: string; starts_at: string | null; ends_at: string | null } | null; certificates: { number: string }[] | { number: string } | null };

export default async function CertificatesPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, courses(slug, title, starts_at, ends_at), certificates(number)")
    .eq("user_id", profile.id)
    .eq("attended", true)
    .order("created_at", { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.courses);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const numberOf = (r: Row) => (Array.isArray(r.certificates) ? r.certificates[0]?.number : r.certificates?.number);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cont</p>
      <h1 className="font-display mt-2 text-5xl font-medium">Adeverințe</h1>
      <p className="mt-4 max-w-2xl text-muted">Adeverințele se emit după ce prezența ta este confirmată la curs. Fiecare are un număr unic, verificabil public.</p>
      {rows.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {rows.map((r) => {
            const n = numberOf(r);
            const c = r.courses!;
            return (
              <li key={r.id} className="rounded-[2rem] border border-line bg-card p-6">
                <h2 className="font-display text-2xl leading-snug">{c.title}</h2>
                <p className="mt-1 text-sm text-muted">{formatDateRange(c.starts_at, c.ends_at)}</p>
                {n ? <p className="mt-3 text-sm">Număr: <strong className="font-mono">{n}</strong></p> : null}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href={`/cont/cursuri/${c.slug}/adeverinta`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">Deschide și descarcă</Link>
                  {n ? (
                    <>
                      <Link href={`/verificare/${n}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-medium">Pagina de verificare</Link>
                      <CopyButton value={`${site}/verificare/${n}`} label="Copiază linkul de verificare" />
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8"><EmptyState title="Nicio adeverință încă" text="După ce participi la un curs și prezența ta este confirmată, adeverința apare aici." href="/cont/cursuri" cta="Cursurile mele" /></div>
      )}
    </div>
  );
}
