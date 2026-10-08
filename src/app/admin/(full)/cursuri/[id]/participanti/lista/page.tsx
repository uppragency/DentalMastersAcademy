import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireAdminClient } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Listă de prezență", robots: { index: false } };

export default async function PrintableList({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminClient();
  const admin = createAdminClient();
  const [{ data: course }, { data }] = await Promise.all([
    admin.from("courses").select("title, starts_at, ends_at, location").eq("id", id).maybeSingle(),
    admin.from("enrollments").select("id, profiles(full_name, email, phone, specialization)").eq("course_id", id),
  ]);
  if (!course) notFound();
  const rows = ((data ?? []) as unknown as { id: string; profiles: { full_name: string | null; email: string; phone: string | null; specialization: string | null } | null }[]).sort((a, b) =>
    (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "", "ro"),
  );
  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}{course.location ? `, ${course.location}` : ""} · {rows.length} participanți</p>
      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead><tr className="border-b-2 border-foreground"><th className="py-2 pr-3">Nr.</th><th className="py-2 pr-3">Nume</th><th className="py-2 pr-3">Telefon</th><th className="py-2 pr-3">Specializare</th><th className="w-48 py-2">Semnătură</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-line"><td className="py-4 pr-3">{i + 1}</td><td className="py-4 pr-3 font-medium">{r.profiles?.full_name ?? r.profiles?.email}</td><td className="py-4 pr-3">{r.profiles?.phone ?? ""}</td><td className="py-4 pr-3">{r.profiles?.specialization ?? ""}</td><td className="py-4" /></tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 print:hidden"><PrintButton /></div>
    </div>
  );
}
