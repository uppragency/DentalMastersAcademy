import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/staff";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Feedback cursuri | Administrare", robots: { index: false } };

type Row = {
  id: string; rating: number; comment: string | null; allow_public: boolean; created_at: string;
  courses: { title: string } | null; profiles: { full_name: string | null; email: string } | null;
};

export default async function FeedbackPage() {
  const { admin } = await requireFullAdmin();
  const { data } = await admin
    .from("course_feedback")
    .select("id, rating, comment, allow_public, created_at, courses(title), profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as unknown as Row[];
  const byCourse = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const t = r.courses?.title ?? "Curs șters";
    const c = byCourse.get(t) ?? { sum: 0, n: 0 };
    c.sum += r.rating;
    c.n += 1;
    byCourse.set(t, c);
  }
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Feedback cursuri</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Cursanții primesc a doua zi după curs un email cu formularul de evaluare. Comentariile cu acord de publicare ajung la Testimoniale, în așteptarea aprobării.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...byCourse.entries()].map(([t, c]) => (
          <li key={t} className="rounded-3xl border border-line bg-card p-6"><p className="text-sm text-muted">{t}</p><p className="mt-2 text-2xl font-semibold">{(c.sum / c.n).toFixed(1)} / 5</p><p className="text-sm text-muted">{c.n} evaluări</p></li>
        ))}
        {byCourse.size === 0 ? <li className="rounded-3xl border border-dashed border-line p-8 text-sm text-muted sm:col-span-2 lg:col-span-3">Nicio evaluare încă.</li> : null}
      </ul>
      <ul className="space-y-3">
        {rows.filter((r) => r.comment).map((r) => (
          <li key={r.id} className="rounded-3xl border border-line bg-card p-6">
            <p className="text-sm text-muted">{r.courses?.title} · {r.rating}/5 · {formatDate(r.created_at)}</p>
            <p className="mt-2 text-[15px] leading-relaxed">{r.comment}</p>
            <p className="mt-3 text-xs text-muted">{r.profiles?.full_name ?? r.profiles?.email}{r.allow_public ? " · acord de publicare" : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
