import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Administrare", robots: { index: false } };

export default async function AdminHome() {
  const supabase = await createClient();
  const [courses, students, paid, revenue] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("total_cents, currency").eq("status", "paid"),
  ]);
  const byCurrency = new Map<string, number>();
  for (const o of revenue.data ?? []) {
    const cur = String(o.currency).trim();
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + o.total_cents);
  }
  const revenueLabel = byCurrency.size ? [...byCurrency].map(([cur, sum]) => formatPrice(sum, cur)).join(" + ") : formatPrice(0, "EUR");
  const stats = [
    { label: "Cursuri publicate", value: String(courses.count ?? 0) },
    { label: "Medici înregistrați", value: String(students.count ?? 0) },
    { label: "Comenzi plătite", value: String(paid.count ?? 0) },
    { label: "Încasări", value: revenueLabel },
  ];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Sumar</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-card p-6">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
