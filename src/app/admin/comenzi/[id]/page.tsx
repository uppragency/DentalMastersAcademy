import { formatDeadline } from "@/lib/transfer";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPendingOrder, resendConfirmation, retryInvoice } from "@/actions/staff";
import { resendTransferInstructions } from "@/actions/ops";
import { MarkPaidForm, RefundForm } from "@/components/staff-forms";
import { Button } from "@/components/ui";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatPrice } from "@/lib/format";
import { tierNames } from "@/lib/loyalty";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = { title: "Detalii comandă | Administrare", robots: { index: false } };

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };

type Billing = { kind?: string; name?: string; cui?: string; reg_com?: string; address?: string; city?: string; county?: string } | null;

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-6 py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin, isAdmin } = await requireStaff();
  const { data } = await admin
    .from("orders")
    .select("*, profiles!orders_user_id_fkey(id, email, full_name), order_items(unit_price_cents, discount_cents, final_price_cents, courses(title, slug))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as unknown as {
    id: string; status: string; source: string; expires_at?: string | null; subtotal_cents: number; discount_cents: number; total_cents: number; currency: string;
    tier_at_purchase: Tier; discount_code: string | null; points_used: number; points_discount_cents: number; points_earned: number;
    stripe_session_id: string | null; stripe_payment_intent: string | null; paid_at: string | null; created_at: string; refunded_at: string | null; refunded_cents: number;
    refund_reason: string | null; manual_note: string | null; invoice_number: string | null; invoice_url: string | null; invoice_error: string | null; billing: Billing;
    profiles: { id: string; email: string; full_name: string | null } | null;
    order_items: { unit_price_cents: number; discount_cents: number; final_price_cents: number; courses: { title: string; slug: string } | null }[];
  };
  const cur = o.currency.trim();
  const m = (c: number) => formatPrice(c, cur);
  const priceDiscount = o.discount_cents - o.points_discount_cents;
  const timeline = [
    { t: o.created_at, l: "Comandă creată" },
    ...(o.paid_at ? [{ t: o.paid_at, l: o.source === "manual" ? "Marcată plătită manual" : o.source === "transfer" ? "Plată prin transfer confirmată" : "Plată confirmată" }] : []),
    ...(o.refunded_at ? [{ t: o.refunded_at, l: `Rambursată${o.refund_reason ? `: ${o.refund_reason}` : ""}` }] : []),
  ];

  return (
    <div className="space-y-8">
      <Link href="/admin/comenzi" className="text-sm text-muted hover:text-foreground">← Comenzi</Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Comandă {o.id.slice(0, 8)}</h1>
        <p className="mt-1 text-sm text-muted">{statusLabel[o.status] ?? o.status} · {o.source === "manual" ? "manuală" : o.source === "transfer" ? "transfer bancar" : "Stripe"} · {formatDate(o.created_at)}{o.status === "pending" && o.source === "transfer" && o.expires_at ? ` · rezervare până ${formatDeadline(o.expires_at)}` : ""}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-7" aria-label="Articole și sume">
          <h2 className="mb-3 text-lg font-semibold">Articole</h2>
          <ul className="divide-y divide-line text-sm">
            {o.order_items.map((i, n) => (
              <li key={n} className="flex justify-between gap-4 py-3"><span>{i.courses?.title ?? "Curs șters"}</span><span>{m(i.unit_price_cents)}</span></li>
            ))}
          </ul>
          <dl className="mt-4 border-t border-line pt-3">
            <Row k="Subtotal" v={m(o.subtotal_cents)} />
            {priceDiscount > 0 ? <Row k={`Reducere${o.discount_code ? ` (${o.discount_code})` : o.tier_at_purchase !== "standard" ? ` (nivel ${tierNames[o.tier_at_purchase]})` : ""}`} v={`−${m(priceDiscount)}`} /> : null}
            {o.points_used > 0 ? <Row k={`Puncte folosite (${o.points_used})`} v={`−${m(o.points_discount_cents)}`} /> : null}
            <Row k="Total plătit" v={m(o.total_cents)} />
            {o.refunded_cents > 0 ? <Row k="Rambursat" v={m(o.refunded_cents)} /> : null}
            <Row k="Puncte câștigate" v={String(o.points_earned)} />
            <Row k="Nivel la achiziție" v={tierNames[o.tier_at_purchase]} />
          </dl>
        </section>

        <section className="rounded-3xl border border-line bg-card p-7" aria-label="Client și plată">
          <h2 className="mb-3 text-lg font-semibold">Client și plată</h2>
          <dl>
            <Row k="Client" v={o.profiles ? <Link href={`/admin/useri/${o.profiles.id}`} className="underline underline-offset-4">{o.profiles.full_name ?? o.profiles.email}</Link> : "—"} />
            <Row k="Email" v={o.profiles?.email ?? "—"} />
            {o.billing ? <Row k="Facturare" v={<>{o.billing.name}{o.billing.cui ? `, CUI ${o.billing.cui}` : ""}<br /><span className="font-normal text-muted">{o.billing.address}, {o.billing.city}, {o.billing.county}</span></>} /> : null}
            {o.stripe_payment_intent ? <Row k="Stripe" v={<a className="underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={`https://dashboard.stripe.com/payments/${o.stripe_payment_intent}`}>{o.stripe_payment_intent}</a>} /> : null}
            {o.manual_note ? <Row k="Motiv manual" v={o.manual_note} /> : null}
            <Row k="Factură" v={o.invoice_url ? <a className="underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={o.invoice_url}>{o.invoice_number ?? "Deschide"}</a> : o.invoice_number ?? (o.invoice_error ? "Eroare la emitere" : "Neemisă")} />
          </dl>
          {o.invoice_error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{o.invoice_error}</p> : null}
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-card p-7" aria-label="Cronologie">
        <h2 className="mb-3 text-lg font-semibold">Cronologie</h2>
        <ol className="space-y-2 text-sm">{timeline.map((t, i) => <li key={i}><span className="text-muted">{formatDate(t.t)}</span> · {t.l}</li>)}</ol>
      </section>

      <section className="rounded-3xl border border-line bg-card p-7" aria-label="Acțiuni">
        <h2 className="mb-5 text-lg font-semibold">Acțiuni</h2>
        <div className="flex flex-wrap gap-3">
          {o.status === "paid" ? <form action={resendConfirmation.bind(null, id)}><Button type="submit" variant="ghost">Retrimite confirmarea</Button></form> : null}
          {o.status === "paid" && isAdmin ? <form action={retryInvoice.bind(null, id)}><Button type="submit" variant="ghost">Reîncearcă factura</Button></form> : null}
          {o.status === "pending" && o.source === "transfer" ? <form action={resendTransferInstructions.bind(null, id)}><Button type="submit" variant="ghost">Retrimite instrucțiunile de plată</Button></form> : null}
          {o.status === "pending" ? <form action={cancelPendingOrder.bind(null, id)}><Button type="submit" variant="ghost">Anulează comanda</Button></form> : null}
        </div>
        {isAdmin && o.status === "pending" ? <div className="mt-6 border-t border-line pt-6"><h3 className="mb-3 font-medium">Marchează plătită</h3><MarkPaidForm orderId={id} /></div> : null}
        {isAdmin && o.status === "paid" ? <div className="mt-6 border-t border-line pt-6"><h3 className="mb-3 font-medium">Rambursare</h3><RefundForm orderId={id} stripe={o.source === "stripe" && Boolean(o.stripe_payment_intent)} /></div> : null}
      </section>
    </div>
  );
}
