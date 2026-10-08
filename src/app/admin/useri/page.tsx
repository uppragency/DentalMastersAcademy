import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { formatDate } from "@/lib/format";
import { tierNames } from "@/lib/loyalty";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = { title: "Useri | Administrare", robots: { index: false } };

const PAGE = 50;
type Row = { id: string; email: string; full_name: string | null; tier: Tier; role: string; created_at: string; disabled_at: string | null; enrollments: { count: number }[] };
const roleLabel: Record<string, string> = { student: "Cursant", instructor: "Instructor", operator: "Operator", admin: "Admin" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; nivel?: string; curs?: string; pagina?: string }> }) {
  const { admin } = await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
  const page = Math.max(1, Number(sp.pagina) || 1);
  const tier = ["standard", "gold", "platinum"].includes(sp.nivel ?? "") ? sp.nivel : "";
  const courseId = sp.curs ?? "";

  const { data: courses } = await admin.from("courses").select("id, title").order("title");
  let ids: string[] | null = null;
  if (courseId) {
    const { data } = await admin.from("enrollments").select("user_id").eq("course_id", courseId).limit(5000);
    ids = (data ?? []).map((r) => r.user_id);
  }

  let query = admin
    .from("profiles")
    .select("id, email, full_name, tier, role, created_at, disabled_at, enrollments(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  if (tier) query = query.eq("tier", tier);
  if (ids) query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data, count } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...(tier ? { nivel: tier } : {}), ...(courseId ? { curs: courseId } : {}), pagina: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Useri</h1>
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_16rem_auto]">
        <input name="q" defaultValue={q} placeholder="Caută după email sau nume" aria-label="Căutare" className="min-h-11 rounded-full border border-line bg-card px-5 text-sm outline-none focus:border-gold" />
        <select name="nivel" defaultValue={tier} aria-label="Nivel" className="min-h-11 rounded-full border border-line bg-card px-4 text-sm">
          <option value="">Toate nivelurile</option><option value="standard">Standard</option><option value="gold">Gold</option><option value="platinum">Platinum</option>
        </select>
        <select name="curs" defaultValue={courseId} aria-label="Curs" className="min-h-11 rounded-full border border-line bg-card px-4 text-sm">
          <option value="">Toate cursurile</option>
          {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm font-medium text-white">Filtrează</button>
      </form>
      <p className="mt-4 text-sm text-muted">{count ?? 0} useri</p>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="px-5 py-3 font-medium">Utilizator</th><th className="px-5 py-3 font-medium">Nivel</th><th className="px-5 py-3 font-medium">Rol</th><th className="px-5 py-3 font-medium">Cursuri</th><th className="px-5 py-3 font-medium">Înregistrat</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={`border-b border-line last:border-0 ${u.disabled_at ? "opacity-50" : ""}`}>
                <td className="px-5 py-4"><Link href={`/admin/useri/${u.id}`} className="font-medium underline-offset-4 hover:underline">{u.full_name ?? u.email}</Link><span className="block text-muted">{u.full_name ? u.email : ""}{u.disabled_at ? " · dezactivat" : ""}</span></td>
                <td className="px-5 py-4">{tierNames[u.tier]}</td>
                <td className="px-5 py-4">{roleLabel[u.role] ?? u.role}</td>
                <td className="px-5 py-4">{u.enrollments?.[0]?.count ?? 0}</td>
                <td className="px-5 py-4">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-muted">Niciun utilizator găsit.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <nav aria-label="Paginare" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={qs(page - 1)} className="rounded-full border border-line px-5 py-2">← Anterior</Link> : <span />}
          <span className="text-muted">Pagina {page} din {pages}</span>
          {page < pages ? <Link href={qs(page + 1)} className="rounded-full border border-line px-5 py-2">Următoarea →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
