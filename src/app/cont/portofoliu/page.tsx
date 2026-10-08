import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { contact } from "@/content/site";

export const metadata: Metadata = { title: "Portofoliu de formare", robots: { index: false } };

type Row = {
  id: string;
  courses: { title: string; starts_at: string | null; ends_at: string | null; location: string | null; trainer_name: string | null; duration_hours: number | null } | null;
  certificates: { number: string; days_attended: number | null }[] | { number: string; days_attended: number | null } | null;
};

export default async function PortfolioPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, courses(title, starts_at, ends_at, location, trainer_name, duration_hours), certificates(number, days_attended)")
    .eq("user_id", profile.id)
    .eq("attended", true);
  const rows = ((data ?? []) as unknown as Row[])
    .filter((r) => r.courses)
    .sort((a, b) => Date.parse(b.courses!.starts_at ?? "0") - Date.parse(a.courses!.starts_at ?? "0"));
  const cert = (r: Row) => (Array.isArray(r.certificates) ? r.certificates[0] : r.certificates);
  const hours = rows.reduce((s, r) => s + Number(r.courses!.duration_hours ?? 0), 0);

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold print:hidden">Cont</p>
      <h1 className="font-display mt-2 text-5xl font-medium">Portofoliu de formare</h1>
      <p className="mt-3 text-muted">
        {profile.full_name ?? profile.email}
        {profile.specialization ? `, ${profile.specialization}` : ""}
        {profile.clinic ? `, ${profile.clinic}` : ""}
        {profile.city ? `, ${profile.city}` : ""}
      </p>
      {rows.length > 0 ? (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">Cursuri absolvite</dt><dd className="font-display mt-2 text-4xl">{rows.length}</dd></div>
            <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">Ore de formare</dt><dd className="font-display mt-2 text-4xl">{hours > 0 ? hours : "-"}</dd></div>
          </dl>
          <ol className="mt-8 divide-y divide-line rounded-3xl border border-line bg-card">
            {rows.map((r) => {
              const c = r.courses!;
              const ce = cert(r);
              return (
                <li key={r.id} className="px-6 py-5">
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDateRange(c.starts_at, c.ends_at)}
                    {c.location ? `, ${c.location}` : ""}
                    {c.duration_hours ? `, ${c.duration_hours} ore` : ""}
                    {ce?.days_attended ? `, ${ce.days_attended} ${ce.days_attended === 1 ? "zi" : "zile"} de prezență` : ""}
                  </p>
                  {c.trainer_name ? <p className="mt-1 text-sm text-muted">Lector: {c.trainer_name}</p> : null}
                  {ce?.number ? <p className="mt-1 text-xs text-muted">Adeverință {ce.number}</p> : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-xs text-muted">Emis de Dental Masters Academy, {contact.address}. Adeverințele se verifică pe site la /verificare.</p>
          <div className="mt-6 print:hidden"><PrintButton /></div>
        </>
      ) : (
        <div className="mt-8"><EmptyState title="Portofoliul este gol" text="Cursurile la care participi apar aici automat, cu ore și adeverințe, gata de exportat pentru dosarul tău." href="/cursuri" cta="Vezi cursurile" /></div>
      )}
    </div>
  );
}
