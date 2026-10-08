import type { Metadata } from "next";
import { offerSeat, removeWaitlistEntry, runWaitlist } from "@/actions/ops";
import { Button } from "@/components/ui";
import { requireFullAdmin } from "@/lib/staff";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Listă de așteptare | Administrare", robots: { index: false } };

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });

type W = { id: string; name: string | null; email: string; phone: string | null; course_id: string | null; desired_course: string | null; created_at: string; notified_at: string | null; offer_expires_at: string | null };

export default async function AdminWaitlist() {
  const { admin } = await requireFullAdmin();
  const [{ data }, { data: courses }, { data: enr }] = await Promise.all([
    admin.from("waitlist").select("id, name, email, phone, course_id, desired_course, created_at, notified_at, offer_expires_at").order("created_at").limit(1000),
    admin.from("courses").select("id, title, capacity"),
    admin.from("enrollments").select("course_id"),
  ]);
  const now = nowMs();
  const taken = new Map<string, number>();
  for (const e of enr ?? []) taken.set(e.course_id, (taken.get(e.course_id) ?? 0) + 1);
  const rows = (data ?? []) as W[];
  const groups = new Map<string, W[]>();
  for (const w of rows) groups.set(w.course_id ?? "none", [...(groups.get(w.course_id ?? "none") ?? []), w]);

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Listă de așteptare</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Când se eliberează un loc (rambursare sau retragere), prima persoană din listă primește automat o ofertă prioritară de 48 de ore. Dacă nu se înscrie în acest timp, locul este oferit următoarei persoane la rularea zilnică, sau imediat cu „Procesează lista”. Persoanele sunt anunțate și când publici o ediție nouă a cursului.</p>
      </div>
      {[...groups.entries()].map(([cid, list]) => {
        const c = (courses ?? []).find((x) => x.id === cid);
        const free = c?.capacity ? c.capacity - (taken.get(cid) ?? 0) : null;
        return (
          <section key={cid}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{c?.title ?? "Fără curs anume"}</h2>
                {c ? <p className="text-sm text-muted">{taken.get(cid) ?? 0}{c.capacity ? ` / ${c.capacity}` : ""} înscriși{free !== null ? ` · ${free > 0 ? `${free} locuri libere` : "complet"}` : ""} · {list.length} în așteptare</p> : null}
              </div>
              {c ? <form action={runWaitlist.bind(null, cid)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">Procesează lista</Button></form> : null}
            </div>
            <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-card">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <tr><th className="p-4">#</th><th className="p-4">Persoană</th><th className="p-4">Telefon</th><th className="p-4">Înscris</th><th className="p-4">Stare</th><th className="p-4" /></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.map((w, i) => {
                    const active = w.offer_expires_at && Date.parse(w.offer_expires_at) > now;
                    return (
                      <tr key={w.id}>
                        <td className="p-4 text-muted">{i + 1}</td>
                        <td className="p-4">{w.name ?? "-"}<span className="block text-muted">{w.email}</span></td>
                        <td className="p-4">{w.phone ?? "-"}</td>
                        <td className="p-4">{fmt.format(new Date(w.created_at))}</td>
                        <td className="p-4">{active ? `Ofertă până ${fmt.format(new Date(w.offer_expires_at!))}` : w.offer_expires_at ? "Ofertă expirată" : w.notified_at ? "Anunțat" : "În așteptare"}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {c ? <form action={offerSeat.bind(null, w.id, cid)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">Oferă loc</Button></form> : null}
                            <form action={removeWaitlistEntry.bind(null, w.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Elimină</Button></form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {rows.length === 0 ? <p className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">Lista este goală.</p> : null}
    </div>
  );
}
