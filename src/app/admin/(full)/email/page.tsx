import type { Metadata } from "next";
import { CampaignForm } from "@/components/staff-forms";
import { requireFullAdmin } from "@/lib/staff";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Email | Administrare", robots: { index: false } };
export const maxDuration = 60;

const audienceLabel: Record<string, string> = { all: "Toți utilizatorii", standard: "Nivel Standard", gold: "Nivel Gold", platinum: "Nivel Platinum", enrolled: "Înscriși la un curs", not_enrolled: "Neînscriși la un curs" };

export default async function EmailPage() {
  const { admin } = await requireFullAdmin();
  const [{ data: courses }, { data: history }] = await Promise.all([
    admin.from("courses").select("id, title").order("title"),
    admin.from("email_campaigns").select("id, subject, segment, recipients, failed, created_at").order("created_at", { ascending: false }).limit(30),
  ]);
  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Email către utilizatori</h1>
        <p className="mt-2 text-sm text-muted">Alege segmentul, scrie mesajul și trimite. Fiecare destinatar primește un email individual, cu salutul pe nume. Conturile dezactivate sau anonimizate sunt excluse.</p>
        <div className="mt-8 rounded-3xl border border-line bg-card p-7"><CampaignForm courses={courses ?? []} /></div>
      </section>
      <section aria-labelledby="h">
        <h2 id="h" className="mb-4 text-2xl font-semibold tracking-tight">Trimiteri anterioare</h2>
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card text-sm">
          {(history ?? []).map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-3 px-5 py-4">
              <span><span className="font-medium">{h.subject}</span><span className="block text-muted">{audienceLabel[(h.segment as { audience: string }).audience] ?? ""}</span></span>
              <span className="text-muted">{formatDate(h.created_at)} · {h.recipients} trimise{h.failed ? `, ${h.failed} eșuate` : ""}</span>
            </li>
          ))}
          {(history ?? []).length === 0 ? <li className="px-5 py-6 text-muted">Nicio trimitere încă.</li> : null}
        </ul>
      </section>
    </div>
  );
}
