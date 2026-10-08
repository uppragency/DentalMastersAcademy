import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendConfirmationLetters, setAttendance } from "@/actions/engagement";
import { Button, ButtonLink } from "@/components/ui";
import { requireAdminClient } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Participanți | Administrare", robots: { index: false } };

type Row = {
  id: string;
  attended: boolean;
  created_at: string;
  source: string;
  profiles: { full_name: string | null; email: string; phone: string | null; specialization: string | null } | null;
  orders: { billing: { name?: string; cui?: string } | null; invoice_number: string | null } | null;
};

export default async function Participants({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminClient();
  const admin = createAdminClient();
  const [{ data: course }, { data }] = await Promise.all([
    admin.from("courses").select("id, title, starts_at, ends_at, capacity").eq("id", id).maybeSingle(),
    admin.from("enrollments").select("id, attended, created_at, source, profiles(full_name, email, phone, specialization), orders(billing, invoice_number)").eq("course_id", id).order("created_at"),
  ]);
  if (!course) notFound();
  const rows = (data ?? []) as unknown as Row[];
  const attended = rows.filter((r) => r.attended).length;

  return (
    <div>
      <Link href={`/admin/cursuri/${id}`} className="text-sm text-muted hover:text-foreground">← Editare curs</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Participanți</h1>
          <p className="mt-1 text-sm text-muted">{course.title} · {formatDateRange(course.starts_at, course.ends_at)} · {rows.length}{course.capacity ? ` / ${course.capacity}` : ""} înscriși · {attended} prezenți</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/admin/cursuri/${id}/participanti/export`} variant="ghost">Export CSV</ButtonLink>
          <form action={sendConfirmationLetters.bind(null, id)}>
            <Button type="submit" variant="gold" disabled={attended === 0}>Trimite adeverințe ({attended})</Button>
          </form>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr><th className="p-4">Nume</th><th className="p-4">Email</th><th className="p-4">Telefon</th><th className="p-4">Specializare</th><th className="p-4">Facturare</th><th className="p-4">Prezență</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-4 font-medium">{r.profiles?.full_name ?? "-"}</td>
                <td className="p-4">{r.profiles?.email}</td>
                <td className="p-4">{r.profiles?.phone ?? "-"}</td>
                <td className="p-4">{r.profiles?.specialization ?? "-"}</td>
                <td className="p-4 text-muted">{r.orders?.billing?.name ?? (r.source === "purchase" ? "-" : r.source)}{r.orders?.billing?.cui ? ` · CUI ${r.orders.billing.cui}` : ""}</td>
                <td className="p-4">
                  <form action={setAttendance.bind(null, r.id, id, !r.attended)}>
                    <Button type="submit" variant={r.attended ? "gold" : "ghost"} className="min-h-9 px-4 text-sm">{r.attended ? "Prezent" : "Marchează"}</Button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted">Niciun participant încă.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
