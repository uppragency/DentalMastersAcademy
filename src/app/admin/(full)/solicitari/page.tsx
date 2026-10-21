import type { Metadata } from "next";
import { updateCaseRequest } from "@/actions/dma";
import { Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { requireFullAdmin } from "@/lib/staff";
import type { CaseRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Solicitări cazuri | Administrare", robots: { index: false } };

const statusNames: Record<CaseRequest["status"], string> = { nou: "Nou", in_analiza: "În analiză", preluat: "Preluat", inchis: "Închis" };
const kindNames = { doctor: "Medic", patient: "Pacient" } as const;

export default async function CaseRequestsPage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const { tip } = await searchParams;
  const { admin } = await requireFullAdmin();
  let q = admin.from("case_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (tip === "doctor" || tip === "patient") q = q.eq("kind", tip);
  const { data } = await q;
  const rows = (data ?? []) as CaseRequest[];

  const withLinks = await Promise.all(
    rows.map(async (r) => {
      const links = await Promise.all(
        r.files.map(async (f) => {
          const { data: signed } = await admin.storage.from("cases").createSignedUrl(f.path, 3600, { download: f.name });
          return { ...f, url: signed?.signedUrl ?? null };
        }),
      );
      return { ...r, links };
    }),
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Solicitări cazuri</h1>
        <p className="mt-2 text-sm text-muted">Cazuri de la medici și solicitări de evaluare de la pacienți. Conțin date medicale: nu le descărca pe dispozitive nesecurizate. Linkurile fișierelor expiră după o oră.</p>
        <nav className="mt-4 flex gap-2 text-sm" aria-label="Filtru tip">
          {[["", "Toate"], ["doctor", "Medici"], ["patient", "Pacienți"]].map(([v, l]) => (
            <a key={v} href={v ? `?tip=${v}` : "?"} className={`rounded-full border px-4 py-1.5 ${(tip ?? "") === v ? "border-ink bg-ink text-white" : "border-line"}`}>{l}</a>
          ))}
        </nav>
      </div>
      <ul className="space-y-5">
        {withLinks.map((r) => (
          <li key={r.id} className="rounded-3xl border border-line bg-card p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">{kindNames[r.kind]} · {statusNames[r.status]}</p>
                <h2 className="mt-1 text-lg font-semibold">{r.name}</h2>
                <p className="text-sm text-muted"><a className="underline underline-offset-4" href={`mailto:${r.email}`}>{r.email}</a>{r.phone ? <> · <a className="underline underline-offset-4" href={`tel:${r.phone}`}>{r.phone}</a></> : null} · {formatDate(r.created_at)}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{r.message}</p>
            {r.links.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm">
                {r.links.map((f) => (
                  <li key={f.path}>{f.url ? <a href={f.url} className="underline underline-offset-4">{f.name}</a> : f.name} <span className="text-muted">({Math.max(1, Math.round(f.size / 1024 / 1024))} MB)</span></li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted">Fără fișiere atașate.</p>}
            <form action={updateCaseRequest.bind(null, r.id)} className="mt-5 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
              <label className="text-sm font-medium">Stare
                <select name="status" defaultValue={r.status} className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-card px-3">
                  {Object.entries(statusNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Notă internă
                <input name="admin_note" defaultValue={r.admin_note ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-card px-3" />
              </label>
              <Button type="submit" className="min-h-11">Salvează</Button>
            </form>
          </li>
        ))}
        {withLinks.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Nicio solicitare.</li> : null}
      </ul>
    </div>
  );
}
