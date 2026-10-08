import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Listă de așteptare | Administrare", robots: { index: false } };

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Bucharest" });

export default async function AdminWaitlist() {
  const supabase = await createClient();
  const { data } = await supabase.from("waitlist").select("*, courses(title)").order("created_at", { ascending: false }).limit(500);
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Listă de așteptare</h1>
      <p className="mt-2 text-sm text-muted">Persoanele de aici sunt anunțate automat prin email când publici o ediție nouă legată de cursul lor (câmpul „Ediție nouă a cursului”).</p>
      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-4">Nume</th><th className="p-4">Email</th><th className="p-4">Telefon</th><th className="p-4">Curs</th><th className="p-4">Data</th><th className="p-4">Anunțat</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((w) => (
              <tr key={w.id}>
                <td className="p-4">{w.name ?? "-"}</td>
                <td className="p-4">{w.email}</td>
                <td className="p-4">{w.phone ?? "-"}</td>
                <td className="p-4">{(w.courses as { title: string } | null)?.title ?? w.desired_course ?? "-"}</td>
                <td className="p-4">{fmt.format(new Date(w.created_at))}</td>
                <td className="p-4">{w.notified_at ? fmt.format(new Date(w.notified_at)) : "Nu"}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted">Lista este goală.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
