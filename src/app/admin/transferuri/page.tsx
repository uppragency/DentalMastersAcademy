import type { Metadata } from "next";
import { approveTransfer, rejectTransfer } from "@/actions/transfers";
import { Button } from "@/components/ui";
import { requireStaff } from "@/lib/staff";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Transferuri de loc | Administrare", robots: { index: false } };

type Row = {
  id: string; to_email: string; note: string | null; status: string; decision_note: string | null; created_at: string;
  enrollments: { courses: { title: string } | null } | null;
  from: { email: string; full_name: string | null } | null;
};
const label: Record<string, string> = { pending: "În așteptare", approved: "Aprobat", rejected: "Respins", cancelled: "Anulat" };

export default async function TransfersPage() {
  const { admin } = await requireStaff();
  const { data } = await admin
    .from("seat_transfers")
    .select("id, to_email, note, status, decision_note, created_at, enrollments(courses(title)), from:profiles!seat_transfers_from_user_fkey(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Transferuri de loc</h1>
        <p className="mt-2 text-sm text-muted">Cereri de la cursanți. La aprobare, înscrierea trece pe contul colegului (care trebuie să existe), iar plata și factura rămân pe contul inițial.</p>
      </header>
      <section aria-label="În așteptare">
        <h2 className="text-xl font-semibold">În așteptare ({pending.length})</h2>
        {pending.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-3xl border border-line bg-card p-6">
                <p className="font-medium">{r.enrollments?.courses?.title ?? "Curs"}</p>
                <p className="mt-1 text-sm text-muted">De la {r.from?.full_name ?? r.from?.email} ({r.from?.email}) către <strong className="text-foreground">{r.to_email}</strong>, {formatDate(r.created_at)}</p>
                {r.note ? <p className="mt-2 text-sm">Mesaj: {r.note}</p> : null}
                {r.decision_note ? <p role="status" className="mt-3 rounded-xl bg-gold-soft px-4 py-3 text-sm">{r.decision_note}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form action={approveTransfer.bind(null, r.id)}><Button type="submit">Aprobă</Button></form>
                  <form action={rejectTransfer.bind(null, r.id)} className="flex flex-wrap items-center gap-2">
                    <input name="reason" placeholder="Motiv (opțional)" aria-label="Motiv respingere" className="min-h-11 rounded-full border border-line bg-background px-4 text-sm outline-none focus:border-gold" />
                    <Button type="submit" variant="ghost" className="text-red-700">Respinge</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">Nicio cerere în așteptare.</p>}
      </section>
      {done.length > 0 ? (
        <section aria-label="Istoric">
          <h2 className="text-xl font-semibold">Istoric</h2>
          <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card text-sm">
            {done.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                <span>{r.enrollments?.courses?.title ?? "Curs"}: {r.from?.email} → {r.to_email}</span>
                <span className="text-muted">{label[r.status]} · {formatDate(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
