import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Dovadă de plată", robots: { index: false } };

type Billing = { name?: string; cui?: string; address?: string; city?: string; county?: string } | null;
type Order = {
  id: string; status: string; subtotal_cents: number; discount_cents: number; points_discount_cents: number; total_cents: number; currency: string;
  paid_at: string | null; created_at: string; provider: string | null; invoice_number: string | null; billing: Billing; refunded_cents: number | null;
  order_items: { final_price_cents: number; courses: { title: string } | null }[];
};

export default async function OrderReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, subtotal_cents, discount_cents, points_discount_cents, total_cents, currency, paid_at, created_at, provider, invoice_number, billing, refunded_cents, order_items(final_price_cents, courses(title))")
    .eq("id", id)
    .maybeSingle();
  const o = data as unknown as Order | null;
  if (!o) notFound();
  const cur = o.currency.trim();
  const paid = o.status === "paid" || o.status === "refunded";
  const method = o.provider === "stripe" ? "Card" : o.provider === "transfer" || o.provider === "bank" ? "Transfer bancar" : o.provider === "manual" ? "Înscriere manuală" : "";
  return (
    <div className="max-w-2xl">
      <Link href="/cont/comenzi" className="text-sm text-muted hover:text-foreground print:hidden">Înapoi la achiziții</Link>
      <h1 className="font-display mt-4 text-4xl font-medium">Dovadă de plată</h1>
      <p className="mt-2 text-sm text-muted">Comandă {o.id.slice(0, 8).toUpperCase()} din {formatDate(o.created_at)}. Documentul confirmă plata și nu înlocuiește factura fiscală.</p>
      <dl className="mt-8 grid grid-cols-2 gap-y-3 rounded-[2rem] border border-line bg-card p-6 text-sm">
        <dt className="text-muted">Status</dt><dd className="text-right font-medium">{paid ? (o.status === "refunded" ? "Rambursată" : "Plătită") : "Neplătită"}</dd>
        {o.paid_at ? (<><dt className="text-muted">Data plății</dt><dd className="text-right">{formatDate(o.paid_at)}</dd></>) : null}
        {method ? (<><dt className="text-muted">Metodă</dt><dd className="text-right">{method}</dd></>) : null}
        {o.billing?.name ? (<><dt className="text-muted">Facturat către</dt><dd className="text-right">{o.billing.name}{o.billing.cui ? `, CUI ${o.billing.cui}` : ""}</dd></>) : null}
        {o.invoice_number ? (<><dt className="text-muted">Factură</dt><dd className="text-right">{o.invoice_number}</dd></>) : null}
      </dl>
      <table className="mt-6 w-full text-left text-sm">
        <tbody>
          {o.order_items.map((i, k) => (
            <tr key={k} className="border-b border-line"><td className="py-3">{i.courses?.title ?? "Curs"}</td><td className="py-3 text-right">{formatPrice(i.final_price_cents, cur)}</td></tr>
          ))}
          {o.discount_cents > 0 ? <tr className="border-b border-line"><td className="py-3 text-muted">Reducere</td><td className="py-3 text-right">-{formatPrice(o.discount_cents, cur)}</td></tr> : null}
          {o.points_discount_cents > 0 ? <tr className="border-b border-line"><td className="py-3 text-muted">Plătit cu puncte</td><td className="py-3 text-right">-{formatPrice(o.points_discount_cents, cur)}</td></tr> : null}
          {o.refunded_cents ? <tr className="border-b border-line"><td className="py-3 text-muted">Rambursat</td><td className="py-3 text-right">{formatPrice(o.refunded_cents, cur)}</td></tr> : null}
          <tr><td className="py-4 font-semibold">Total plătit</td><td className="py-4 text-right text-lg font-semibold">{formatPrice(o.total_cents, cur)}</td></tr>
        </tbody>
      </table>
      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        <PrintButton />
        {o.invoice_number ? <a href={`/api/facturi/${o.id}`} className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-white">Descarcă factura (PDF)</a> : null}
      </div>
    </div>
  );
}
