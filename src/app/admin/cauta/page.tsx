import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Căutare | Administrare", robots: { index: false } };

const uuidRe = /^[0-9a-f]{8}(-[0-9a-f]{4}){0,4}/i;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { admin } = await requireStaff();
  const q = ((await searchParams).q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
  if (q.length < 2) return <p className="text-muted">Introdu cel puțin 2 caractere în căutare.</p>;

  const orderFilters = [`invoice_number.ilike.%${q}%`, `stripe_session_id.ilike.%${q}%`, `stripe_payment_intent.ilike.%${q}%`];
  const [users, orders, courses] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, tier").or(`email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(20),
    admin.from("orders").select("id, status, total_cents, currency, created_at, profiles(email)").or(orderFilters.join(",")).limit(20),
    admin.from("courses").select("id, title").ilike("title", `%${q}%`).limit(10),
  ]);
  let byId: { id: string; status: string; total_cents: number; currency: string; created_at: string; profiles: unknown }[] = [];
  if (uuidRe.test(q) && q.length >= 8) {
    const { data } = await admin.from("orders").select("id, status, total_cents, currency, created_at, profiles(email)").limit(500).order("created_at", { ascending: false });
    byId = (data ?? []).filter((o) => o.id.startsWith(q.toLowerCase())) as typeof byId;
  }
  const allOrders = [...byId, ...((orders.data ?? []) as typeof byId)].filter((o, i, a) => a.findIndex((x) => x.id === o.id) === i);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Rezultate pentru „{q}”</h1>
      <section aria-labelledby="u"><h2 id="u" className="mb-3 text-lg font-semibold">Useri</h2>
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card text-sm">
          {(users.data ?? []).map((u) => <li key={u.id}><Link href={`/admin/useri/${u.id}`} className="flex justify-between gap-3 px-5 py-3 hover:bg-background"><span className="font-medium">{u.full_name ?? u.email}<span className="ml-3 font-normal text-muted">{u.full_name ? u.email : ""}</span></span><span className="text-muted">{u.tier}</span></Link></li>)}
          {(users.data ?? []).length === 0 ? <li className="px-5 py-4 text-muted">Niciun user.</li> : null}
        </ul>
      </section>
      <section aria-labelledby="o"><h2 id="o" className="mb-3 text-lg font-semibold">Comenzi</h2>
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card text-sm">
          {allOrders.map((o) => <li key={o.id}><Link href={`/admin/comenzi/${o.id}`} className="flex justify-between gap-3 px-5 py-3 hover:bg-background"><span className="font-medium">{o.id.slice(0, 8)}<span className="ml-3 font-normal text-muted">{(o.profiles as { email: string } | null)?.email}</span></span><span className="text-muted">{formatDate(o.created_at)} · {formatPrice(o.total_cents, o.currency.trim())} · {o.status}</span></Link></li>)}
          {allOrders.length === 0 ? <li className="px-5 py-4 text-muted">Nicio comandă. Poți căuta după număr de factură sau ID de comandă.</li> : null}
        </ul>
      </section>
      <section aria-labelledby="c"><h2 id="c" className="mb-3 text-lg font-semibold">Cursuri</h2>
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card text-sm">
          {(courses.data ?? []).map((c) => <li key={c.id}><Link href={`/admin/cursuri/${c.id}`} className="block px-5 py-3 hover:bg-background">{c.title}</Link></li>)}
          {(courses.data ?? []).length === 0 ? <li className="px-5 py-4 text-muted">Niciun curs.</li> : null}
        </ul>
      </section>
    </div>
  );
}
