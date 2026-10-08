import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile, getMyOrders } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Comenzi", robots: { index: false } };

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };

export default async function MyOrders() {
  const profile = (await getCurrentProfile())!;
  const orders = await getMyOrders(profile.id);
  return (
    <div>
      <h1 className="font-display text-5xl font-medium">Istoric achiziții</h1>
      {orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-[2rem] border border-line bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Documente</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4">{formatDate(o.created_at)}</td>
                  <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                  <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                  <td className="px-5 py-4">{statusLabel[o.status] ?? o.status}</td>
                  <td className="px-5 py-4">{o.status === "paid" || o.status === "refunded" ? <Link className="underline underline-offset-4" href={`/cont/comenzi/${o.id}`}>Dovadă și factură</Link> : <span className="text-muted">Indisponibil</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-12 text-center text-muted">Nu există achiziții.</p>
      )}
    </div>
  );
}
