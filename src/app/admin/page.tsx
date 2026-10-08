import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { getSeatCounts } from "@/lib/data";
import { formatDate, formatPrice, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Administrare", robots: { index: false } };

export default async function AdminHome() {
  const { admin, isAdmin } = await requireStaff();
  const now = nowMs();
  const since30 = new Date(now - 30 * 86_400_000).toISOString();
  const stale = new Date(now - 3_600_000).toISOString();

  const [paid30, users30, pendingOld, invoiceErr, redemptions, courses, recent, ledger, settings, seats, transfers, seatReq] = await Promise.all([
    admin.from("orders").select("total_cents, currency").eq("status", "paid").gte("paid_at", since30),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since30),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending").lt("created_at", stale),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid").not("invoice_error", "is", null),
    admin.from("discount_redemptions").select("id", { count: "exact", head: true }).gte("created_at", since30),
    admin.from("courses").select("id, title, slug, starts_at, ends_at, capacity, status").eq("status", "published").order("starts_at", { ascending: true }),
    admin.from("enrollments").select("id, created_at, source, profiles(id, full_name, email), courses(title)").order("created_at", { ascending: false }).limit(8),
    isAdmin ? admin.from("points_ledger").select("remaining, expires_at").gt("remaining", 0) : Promise.resolve({ data: [] as { remaining: number; expires_at: string | null }[] }),
    admin.from("loyalty_settings").select("point_value_cents").maybeSingle(),
    getSeatCounts(),
    admin.from("orders").select("id, total_cents, currency, expires_at, created_at, profiles!orders_user_id_fkey(full_name, email), order_items(courses(title))").eq("status", "pending").eq("source", "transfer").order("expires_at", { ascending: true }).limit(20),
    admin.from("seat_transfers").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  type TransferRow = { id: string; total_cents: number; currency: string; expires_at: string | null; profiles: { full_name: string | null; email: string } | null; order_items: { courses: { title: string } | null }[] };
  const transferRows = (transfers.data ?? []) as unknown as TransferRow[];
  const todayStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(now));
  const expiresToday = (t: TransferRow) => t.expires_at !== null && new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(t.expires_at)) === todayStr;
  type Todo = { text: string; href: string; strong?: boolean };
  const todoRaw: Todo[] = [
    ...transferRows.map((t) => ({
      text: `Transfer de confirmat: ${t.profiles?.full_name ?? t.profiles?.email ?? "client"}, ${t.order_items[0]?.courses?.title ?? "curs"}, ${formatPrice(t.total_cents, t.currency.trim())}${t.expires_at ? (expiresToday(t) ? ", rezervarea expiră azi" : `, rezervat până ${formatDate(t.expires_at)}`) : ""}`,
      href: `/admin/comenzi/${t.id}`,
      strong: expiresToday(t),
    })),
    ...((seatReq.count ?? 0) > 0 ? [{ text: `${seatReq.count} cereri de transfer de loc de analizat`, href: "/admin/transferuri" }] : []),
    ...((invoiceErr.count ?? 0) > 0 ? [{ text: `${invoiceErr.count} comenzi plătite cu eroare la facturare`, href: "/admin/comenzi?status=paid" }] : []),
  ];
  const todo = [...todoRaw].sort((a, b) => Number(b.strong ?? false) - Number(a.strong ?? false));

  const byCur = new Map<string, number>();
  for (const o of paid30.data ?? []) byCur.set(String(o.currency).trim(), (byCur.get(String(o.currency).trim()) ?? 0) + o.total_cents);
  const revenue = byCur.size ? [...byCur].map(([c, s]) => formatPrice(s, c)).join(" + ") : formatPrice(0, "EUR");
  const liabilityPts = (ledger.data ?? []).filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now).reduce((s, r) => s + r.remaining, 0);
  const liability = formatPrice(Math.round(liabilityPts * Number(settings.data?.point_value_cents ?? 5)), "EUR");
  const upcoming = (courses.data ?? []).filter((c) => !isEnded(c as never, now)).slice(0, 6);

  const stats = [
    ...(isAdmin ? [{ label: "Încasări, ultimele 30 de zile", value: revenue }] : []),
    { label: "Comenzi plătite, 30 de zile", value: String(paid30.data?.length ?? 0) },
    { label: "Useri noi, 30 de zile", value: String(users30.count ?? 0) },
    { label: "Coduri folosite, 30 de zile", value: String(redemptions.count ?? 0) },
    ...(isAdmin ? [{ label: "Puncte active (valoare)", value: `${liabilityPts} (${liability})` }] : []),
  ];
  const alerts = [
    (pendingOld.count ?? 0) > 0 ? { text: `${pendingOld.count} comenzi în așteptare de peste o oră`, href: "/admin/comenzi?status=pending" } : null,
  ].filter((a): a is { text: string; href: string } => a !== null);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Sumar</h1>
      <section aria-labelledby="azi" className="rounded-3xl border border-line bg-card p-7">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="azi" className="text-lg font-semibold">De făcut azi</h2>
          <Link href="/admin/plati" className="text-sm font-medium underline underline-offset-4">Potrivește plățile din extras</Link>
        </div>
        {todo.length > 0 ? (
          <ul className="divide-y divide-line text-sm">
            {todo.map((t) => (
              <li key={t.href + t.text}><Link href={t.href} className={`block py-3 hover:underline ${t.strong ? "font-semibold" : ""}`}>{t.text}</Link></li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nimic de făcut acum. Nu sunt transferuri de confirmat, cereri sau facturi cu eroare.</p>
        )}
      </section>
      {alerts.length > 0 ? (
        <ul className="space-y-2">{alerts.map((a) => <li key={a.href}><Link href={a.href} className="block rounded-2xl bg-gold-soft px-5 py-3 text-sm font-medium hover:underline">{a.text}</Link></li>)}</ul>
      ) : null}
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">{s.label}</dt><dd className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</dd></div>
        ))}
      </dl>
      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="ed" className="rounded-3xl border border-line bg-card p-7">
          <h2 id="ed" className="mb-4 text-lg font-semibold">Ediții și locuri</h2>
          <ul className="divide-y divide-line text-sm">
            {upcoming.map((c) => {
              const taken = seats[c.id] ?? 0;
              const pct = c.capacity ? Math.min(100, Math.round((taken / c.capacity) * 100)) : 0;
              return (
                <li key={c.id} className="py-3">
                  <div className="flex justify-between gap-3"><Link href={`/admin/cursuri/${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.title}</Link><span className="text-muted">{formatDate(c.starts_at)}</span></div>
                  <div className="mt-2 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div><span className="text-xs text-muted">{taken}{c.capacity ? ` / ${c.capacity}` : ""}</span></div>
                </li>
              );
            })}
            {upcoming.length === 0 ? <li className="py-3 text-muted">Nicio ediție viitoare.</li> : null}
          </ul>
        </section>
        <section aria-labelledby="rec" className="rounded-3xl border border-line bg-card p-7">
          <h2 id="rec" className="mb-4 text-lg font-semibold">Înscrieri recente</h2>
          <ul className="divide-y divide-line text-sm">
            {(recent.data ?? []).map((e) => {
              const p = e.profiles as unknown as { id: string; full_name: string | null; email: string } | null;
              const c = e.courses as unknown as { title: string } | null;
              return (
                <li key={e.id} className="flex justify-between gap-3 py-3">
                  <span>{p ? <Link href={`/admin/useri/${p.id}`} className="font-medium underline-offset-4 hover:underline">{p.full_name ?? p.email}</Link> : "—"}<span className="block text-muted">{c?.title}</span></span>
                  <span className="shrink-0 text-muted">{formatDate(e.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
