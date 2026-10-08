import type { Metadata } from "next";
import Link from "next/link";
import { cancelPendingOrder } from "@/actions/staff";
import { sendRecoveryNow } from "@/actions/ops";
import { Button } from "@/components/ui";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatPrice } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Comenzi neplătite | Administrare", robots: { index: false } };

type Row = {
  id: string;
  source: string;
  total_cents: number;
  currency: string;
  created_at: string;
  recovery_sent_at: string | null;
  profiles: { email: string; full_name: string | null } | null;
  order_items: { courses: { title: string } | null }[];
};

function age(iso: string, now: number) {
  const h = Math.floor((now - Date.parse(iso)) / 3_600_000);
  return h < 48 ? `${h} h` : `${Math.floor(h / 24)} zile`;
}

export default async function Abandoned() {
  const { admin } = await requireStaff();
  const now = nowMs();
  const { data } = await admin
    .from("orders")
    .select("id, source, total_cents, currency, created_at, recovery_sent_at, profiles!orders_user_id_fkey(email, full_name), order_items(courses(title))")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const card = rows.filter((r) => r.source === "stripe" && now - Date.parse(r.created_at) > 3_600_000);
  const transfer = rows.filter((r) => r.source === "transfer");

  const table = (list: Row[], recovery: boolean) =>
    list.length === 0 ? (
      <p className="mt-4 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">Nimic de afișat.</p>
    ) : (
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="px-5 py-3 font-medium">Client</th><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Vechime</th><th className="px-5 py-3 font-medium" /></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4">{o.profiles?.full_name ?? o.profiles?.email}<span className="block text-muted">{o.profiles?.full_name ? o.profiles.email : ""}</span></td>
                <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                <td className="px-5 py-4">{age(o.created_at, now)}{o.recovery_sent_at ? <span className="block text-xs text-muted">Email trimis {formatDate(o.recovery_sent_at)}</span> : null}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    {recovery && !o.recovery_sent_at ? <form action={sendRecoveryNow.bind(null, o.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">Trimite email</Button></form> : null}
                    <Link href={`/admin/comenzi/${o.id}`} className="inline-flex min-h-9 items-center rounded-full border border-line px-4 text-sm hover:bg-card">Deschide</Link>
                    <form action={cancelPendingOrder.bind(null, o.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Anulează</Button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Comenzi neplătite</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Plățile cu cardul începute și nefinalizate de peste 1 oră. Clientul primește automat un singur email de reamintire (zilnic, la prima rulare după 1 oră). Comenzile fără plată după 24 de ore se anulează automat, iar punctele folosite se returnează.</p>
        {table(card, true)}
      </section>
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">În așteptarea transferului bancar</h2>
        <p className="mt-2 text-sm text-muted">Se confirmă manual din comandă, cu „Marchează plătită”. Nu se anulează automat.</p>
        {table(transfer, false)}
      </section>
    </div>
  );
}
