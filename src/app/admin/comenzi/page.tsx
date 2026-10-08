import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Comenzi | Administrare", robots: { index: false } };

type Row = {
  id: string;
  status: string;
  source: string;
  total_cents: number;
  currency: string;
  created_at: string;
  invoice_number: string | null;
  profiles: { email: string; full_name: string | null } | null;
  order_items: { courses: { title: string } | null }[];
};

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };
const PAGE = 50;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; pagina?: string }> }) {
  const { admin } = await requireStaff();
  const sp = await searchParams;
  const status = Object.keys(statusLabel).includes(sp.status ?? "") ? sp.status! : "";
  const page = Math.max(1, Number(sp.pagina) || 1);
  let q = admin
    .from("orders")
    .select("id, status, source, total_cents, currency, created_at, invoice_number, profiles!orders_user_id_fkey(email, full_name), order_items(courses(title))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (status) q = q.eq("status", status);
  const { data, count } = await q;
  const orders = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number, s = status) => `?${new URLSearchParams({ ...(s ? { status: s } : {}), pagina: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Comenzi</h1>
      <nav aria-label="Filtru status" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[["", "Toate"], ...Object.entries(statusLabel)].map(([k, l]) => (
          <Link key={k} href={href(1, k)} aria-current={status === k ? "page" : undefined} className={`rounded-full px-4 py-2 ${status === k ? "bg-ink text-white" : "border border-line text-muted hover:text-foreground"}`}>{l}</Link>
        ))}
      </nav>
      {orders.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Medic</th><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4"><Link href={`/admin/comenzi/${o.id}`} className="underline-offset-4 hover:underline">{formatDate(o.created_at)}</Link></td>
                  <td className="px-5 py-4">{o.profiles?.full_name ?? o.profiles?.email}<span className="block text-muted">{o.profiles?.full_name ? o.profiles.email : ""}</span></td>
                  <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                  <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                  <td className="px-5 py-4">{statusLabel[o.status] ?? o.status}{o.source === "manual" ? <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] text-gold">manuală</span> : null}{o.source === "transfer" ? <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] text-gold">transfer</span> : null}{o.invoice_number ? <span className="block text-xs text-muted">Factura {o.invoice_number}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-12 text-center text-muted">Nu există comenzi.</p>
      )}
      {pages > 1 ? (
        <nav aria-label="Paginare" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="rounded-full border border-line px-5 py-2">← Anterior</Link> : <span />}
          <span className="text-muted">Pagina {page} din {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="rounded-full border border-line px-5 py-2">Următoarea →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
