import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setDayAttendance } from "@/actions/ops";
import { requireStaff } from "@/lib/staff";
import { courseDays, formatDateRange } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Check-in | Administrare", robots: { index: false } };

const dayLabel = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(nowMs()));

type Row = { id: string; profiles: { full_name: string | null; email: string; phone: string | null } | null };

export default async function CheckIn({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ zi?: string; q?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { admin } = await requireStaff();
  const { data: course } = await admin.from("courses").select("id, title, starts_at, ends_at").eq("id", id).maybeSingle();
  if (!course) notFound();
  const days = courseDays(course.starts_at, course.ends_at);
  const day = days.includes(sp.zi ?? "") ? sp.zi! : days.includes(today()) ? today() : days[0];
  const q = (sp.q ?? "").trim().toLowerCase();

  const [{ data: enr }, { data: att }, { data: certs }] = await Promise.all([
    admin.from("enrollments").select("id, profiles(full_name, email, phone)").eq("course_id", id),
    admin.from("attendance").select("enrollment_id, day, present").eq("present", true),
    admin.from("certificates").select("enrollment_id, number"),
  ]);
  const rows = ((enr ?? []) as unknown as Row[])
    .filter((r) => !q || `${r.profiles?.full_name ?? ""} ${r.profiles?.email ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => (a.profiles?.full_name ?? a.profiles?.email ?? "").localeCompare(b.profiles?.full_name ?? b.profiles?.email ?? "", "ro"));
  const ids = new Set(rows.map((r) => r.id));
  const presentToday = new Set((att ?? []).filter((a) => a.day === day && ids.has(a.enrollment_id)).map((a) => a.enrollment_id));
  const daysCount = new Map<string, number>();
  for (const a of att ?? []) daysCount.set(a.enrollment_id, (daysCount.get(a.enrollment_id) ?? 0) + 1);
  const certByEnr = new Map((certs ?? []).map((c) => [c.enrollment_id, c.number]));

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/prezenta" className="text-sm text-muted hover:text-foreground">← Cursuri</Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)} · {rows.length} înscriși · {presentToday.size} prezenți în ziua selectată</p>
      {days.length > 1 ? (
        <nav aria-label="Ziua cursului" className="mt-5 flex flex-wrap gap-2 text-sm">
          {days.map((d) => (
            <Link key={d} href={`?zi=${d}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={d === day ? "page" : undefined} className={`rounded-full px-4 py-2 ${d === day ? "bg-ink text-white" : "border border-line text-muted"}`}>{dayLabel.format(new Date(d))}</Link>
          ))}
        </nav>
      ) : null}
      <form className="mt-5" role="search">
        <input type="hidden" name="zi" value={day} />
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Caută participant" aria-label="Caută participant" className="min-h-12 w-full rounded-full border border-line bg-card px-5 text-base outline-none focus:border-gold" />
      </form>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => {
          const here = presentToday.has(r.id);
          const cert = certByEnr.get(r.id);
          return (
            <li key={r.id} className={`flex items-center justify-between gap-3 rounded-3xl border p-4 ${here ? "border-gold bg-gold-soft" : "border-line bg-card"}`}>
              <div className="min-w-0">
                <p className="truncate font-medium">{r.profiles?.full_name ?? r.profiles?.email}</p>
                <p className="truncate text-xs text-muted">{r.profiles?.phone ?? r.profiles?.email}{cert ? ` · ${cert}` : ""}{(daysCount.get(r.id) ?? 0) > 0 ? ` · ${daysCount.get(r.id)} zile` : ""}</p>
              </div>
              <form action={setDayAttendance.bind(null, r.id, id, day, !here)}>
                <button type="submit" className={`min-h-12 min-w-28 rounded-full px-5 text-sm font-semibold ${here ? "bg-ink text-white" : "border border-line bg-card"}`}>{here ? "Prezent" : "Marchează"}</button>
              </form>
            </li>
          );
        })}
        {rows.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">Niciun participant.</li> : null}
      </ul>
    </div>
  );
}
