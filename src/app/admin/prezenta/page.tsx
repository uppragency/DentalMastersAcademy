import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { formatDateRange, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Prezență | Administrare", robots: { index: false } };

export default async function AttendanceIndex() {
  const { admin } = await requireStaff();
  const { data } = await admin.from("courses").select("id, title, starts_at, ends_at").eq("status", "published").not("starts_at", "is", null).order("starts_at", { ascending: false }).limit(30);
  const now = nowMs();
  const courses = data ?? [];
  const upcoming = courses.filter((c) => !isEnded(c, now));
  const past = courses.filter((c) => isEnded(c, now));
  const list = (items: typeof courses) => (
    <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/admin/prezenta/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 hover:bg-background">
            <span className="font-medium">{c.title}</span>
            <span className="text-sm text-muted">{formatDateRange(c.starts_at, c.ends_at)}</span>
          </Link>
        </li>
      ))}
      {items.length === 0 ? <li className="p-6 text-sm text-muted">Niciun curs.</li> : null}
    </ul>
  );
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Prezență</h1>
        <p className="mt-2 text-sm text-muted">Deschide pagina de pe telefon în ziua cursului. Cine este marcat prezent primește automat adeverința cu număr unic.</p>
      </div>
      <section><h2 className="text-xl font-semibold">Curs în desfășurare sau viitor</h2>{list(upcoming)}</section>
      <section><h2 className="text-xl font-semibold">Cursuri încheiate</h2>{list(past)}</section>
    </div>
  );
}
