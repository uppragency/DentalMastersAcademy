import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Comenzi | Administrare", robots: { index: false } };

type Row = {
  id: string;
  status: string;
  total_cents: number;
  discount_cents: number;
  currency: string;
  created_at: string;
  profiles: { email: string; full_name: string | null } | null;
  order_items: { courses: { title: string } | null }[];
};

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };

export default async function AdminOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, total_cents, discount_cents, currency, created_at, profiles(email, full_name), order_items(courses(title))")
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Comenzi</h1>
      {orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Medic</th><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4">{formatDate(o.created_at)}</td>
                  <td className="px-5 py-4">{o.profiles?.full_name ?? o.profiles?.email}<span className="block text-muted">{o.profiles?.full_name ? o.profiles.email : ""}</span></td>
                  <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                  <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                  <td className="px-5 py-4">{statusLabel[o.status] ?? o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-12 text-center text-muted">Nu există comenzi.</p>
      )}
    </>
  );
}
