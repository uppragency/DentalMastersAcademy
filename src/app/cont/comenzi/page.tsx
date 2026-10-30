import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { EmptyState } from "@/components/empty-state";
import { getCurrentProfile, getMyOrders } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Comenzi"), robots: { index: false } };
}

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };

export default async function MyOrders() {
  const profile = (await getCurrentProfile())!;
  const orders = await getMyOrders(profile.id);
  return (
    <div>
      <h1 className="font-display text-5xl font-medium">{tr("Istoric achiziții")}</h1>
      {orders.some((o) => o.status === "paid") ? (
        <p className="mt-4 text-sm text-muted">
          {tr("Facturi pentru contabil:")}{" "}
          {[...new Set(orders.map((o) => new Date(o.created_at).getFullYear()))].map((y) => (
            <a key={y} href={`/api/facturi/arhiva?an=${y}`} className="mr-3 font-medium text-foreground underline underline-offset-4">ZIP {y}</a>
          ))}
        </p>
      ) : null}
      {orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-[2rem] border border-line bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-3 font-medium">{tr("Data")}</th><th className="px-5 py-3 font-medium">{tr("Curs")}</th><th className="px-5 py-3 font-medium">{tr("Total")}</th><th className="px-5 py-3 font-medium">{tr("Status")}</th><th className="px-5 py-3 font-medium">{tr("Detalii")}</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4">{formatDate(o.created_at)}</td>
                  <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                  <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                  <td className="px-5 py-4">{statusLabel[o.status] ?? o.status}</td>
                  <td className="px-5 py-4"><Link className="inline-flex min-h-9 items-center rounded-full border border-line px-4 font-medium transition-colors hover:bg-background" href={`/cont/comenzi/${o.id}`}>{tr("Deschide comanda")}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8"><EmptyState title={tr("Nu ai achiziții")} text={tr("Comenzile, dovezile de plată și facturile apar aici după prima înscriere.")} href="/cursuri" cta={tr("Vezi cursurile")} /></div>
      )}
    </div>
  );
}
