import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { courseMethods, formatDeadline, parseIbans } from "@/lib/transfer";
import { contact } from "@/content/site";
import { ButtonLink } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { PrintButton } from "@/components/print-button";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Comandă", robots: { index: false } };

type Billing = { kind?: string; name?: string; cui?: string; reg_com?: string; address?: string; city?: string; county?: string } | null;
type Order = {
  id: string; status: string; source: string | null; expires_at: string | null; subtotal_cents: number; discount_cents: number; points_discount_cents: number; points_used: number;
  total_cents: number; currency: string; paid_at: string | null; created_at: string; provider: string | null; invoice_number: string | null; billing: Billing;
  refunded_cents: number | null; discount_code: string | null; tier_at_purchase: string | null;
  order_items: { unit_price_cents: number; final_price_cents: number; courses: { title: string; slug: string; payment_methods: string[] | null } | null }[];
};

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };
const statusTone: Record<string, string> = { pending: "bg-gold-soft text-gold", paid: "bg-emerald-100 text-emerald-800", refunded: "bg-card text-muted border border-line", cancelled: "bg-card text-muted border border-line", failed: "bg-red-100 text-red-800" };
const tierLabel: Record<string, string> = { gold: "Gold", platinum: "Platinum" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-6 sm:p-8">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-6 py-1.5 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, source, expires_at, subtotal_cents, discount_cents, points_discount_cents, points_used, total_cents, currency, paid_at, created_at, provider, invoice_number, billing, refunded_cents, discount_code, tier_at_purchase, order_items(unit_price_cents, final_price_cents, courses(title, slug, payment_methods))")
    .eq("id", id)
    .maybeSingle();
  const o = data as unknown as Order | null;
  if (!o || !profile) notFound();

  const cur = o.currency.trim();
  const paid = o.status === "paid" || o.status === "refunded";
  const isTransfer = o.source === "transfer" || o.provider === "transfer" || o.provider === "bank";
  const method = o.provider === "manual" || o.source === "manual" ? "Înscriere manuală" : isTransfer ? "Transfer bancar" : "Card bancar (Stripe)";
  const course = o.order_items[0]?.courses;
  const activeTransfer = o.status === "pending" && o.source === "transfer" && o.expires_at && Date.parse(o.expires_at) > nowMs();
  const cardPending = o.status === "pending" && o.source !== "transfer";
  const codeOrTier = o.discount_cents - o.points_discount_cents;
  const discountLabel = o.discount_code ? `Cod ${o.discount_code}` : o.tier_at_purchase && tierLabel[o.tier_at_purchase] ? `Reducere ${tierLabel[o.tier_at_purchase]}` : "Reducere";

  let bank = "";
  if (activeTransfer) {
    const { data: b } = await createAdminClient().from("site_content").select("value").eq("key", "private:bank").maybeSingle();
    bank = typeof b?.value === "string" ? b.value : "";
  }
  const bankLines = bank.split("\n").map((l) => l.trim()).filter(Boolean);
  const ibans = parseIbans(bankLines);
  const canCard = course ? courseMethods(course.payment_methods).includes("card") : false;
  const shortId = o.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-5xl">
      <Link href="/cont/comenzi" className="text-sm text-muted hover:text-foreground print:hidden">← Înapoi la achiziții</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-medium">Comanda {shortId}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[o.status] ?? "bg-card"}`}>{statusLabel[o.status] ?? o.status}</span>
      </div>
      <p className="mt-2 text-sm text-muted">Plasată pe {formatDate(o.created_at)}{paid && o.paid_at ? `, plătită pe ${formatDate(o.paid_at)}` : ""}.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {activeTransfer ? (
            <section className="rounded-[2rem] border border-gold bg-gold-soft p-6 sm:p-8">
              <h2 className="font-display text-xl">De plată prin transfer bancar</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Locul tău este rezervat până {formatDeadline(o.expires_at!)}. Dacă plata nu ajunge până atunci, comanda se anulează automat.</p>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                {bankLines.map((l) => {
                  const i = l.indexOf(":");
                  return i > 0 ? (<div key={l} className="contents"><dt className="text-muted">{l.slice(0, i)}</dt><dd className="break-all font-medium">{l.slice(i + 1).trim()}</dd></div>) : (<div key={l} className="col-span-2 font-medium">{l}</div>);
                })}
                <dt className="text-muted">Sumă</dt><dd className="font-semibold">{formatPrice(o.total_cents, cur)}</dd>
                <dt className="text-muted">Detalii plată</dt><dd className="font-medium">Comanda {shortId}</dd>
              </dl>
              <ol className="mt-6 space-y-3 border-t border-gold/30 pt-5 text-sm">
                <li><span className="font-semibold">1. Fă plata</span> cu datele de mai sus, cu numărul comenzii la detalii.</li>
                <li><span className="font-semibold">2. Trimite dovada</span> la <a className="underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a>, cu o captură a transferului.</li>
                <li><span className="font-semibold">3. Îți activăm înscrierea</span> după ce vedem banii în cont. Factura se emite la confirmare.</li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-3 print:hidden">
                {ibans.map((i) => <CopyButton key={i.value} value={i.value} label={i.label ? `Copiază IBAN ${i.label}` : "Copiază IBAN"} />)}
                {canCard && course ? <ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="ghost">Plătește cu cardul</ButtonLink> : null}
              </div>
              {canCard ? <p className="mt-3 text-xs text-muted print:hidden">Dacă plata cu cardul reușește, această comandă se anulează automat.</p> : null}
            </section>
          ) : null}

          {o.status === "pending" && o.source === "transfer" && !activeTransfer ? (
            <p role="status" className="rounded-2xl border border-line bg-card px-5 py-4 text-sm">Rezervarea prin transfer a expirat. Dacă ai plătit deja, scrie-ne la <a className="underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a>.</p>
          ) : null}

          {cardPending && course ? (
            <section className="rounded-[2rem] border border-gold bg-gold-soft p-6 sm:p-8">
              <h2 className="font-display text-xl">Plata cu cardul nu a fost finalizată</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Poți relua înscrierea oricând, cât mai sunt locuri. Comenzile cu cardul nefinalizate se anulează automat după 24 de ore.</p>
              <div className="mt-4 print:hidden"><ButtonLink href={`/cursuri/${course.slug}/achizitie`} variant="gold">Reia plata</ButtonLink></div>
            </section>
          ) : null}

          {o.status === "cancelled" && course ? (
            <p role="status" className="rounded-2xl border border-line bg-card px-5 py-4 text-sm">Comanda a fost anulată. <Link className="font-medium underline underline-offset-4" href={`/cursuri/${course.slug}`}>Vezi cursul</Link></p>
          ) : null}

          <Card title="Articole comandate">
            <ul className="divide-y divide-line">
              {o.order_items.map((i, k) => (
                <li key={k} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <span>{i.courses ? <Link className="font-medium hover:text-gold" href={paid ? `/cont/cursuri/${i.courses.slug}` : `/cursuri/${i.courses.slug}`}>{i.courses.title}</Link> : "Curs"}</span>
                  <span className="shrink-0 font-medium">{formatPrice(i.unit_price_cents, cur)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-4">
              <Row k="Subtotal" v={formatPrice(o.subtotal_cents, cur)} />
              {codeOrTier > 0 ? <div className="flex justify-between gap-6 py-1.5 text-sm text-gold"><dt>{discountLabel}</dt><dd className="font-medium">−{formatPrice(codeOrTier, cur)}</dd></div> : null}
              {o.points_discount_cents > 0 ? <div className="flex justify-between gap-6 py-1.5 text-sm text-gold"><dt>Plătit cu {o.points_used} puncte</dt><dd className="font-medium">−{formatPrice(o.points_discount_cents, cur)}</dd></div> : null}
              {o.refunded_cents ? <Row k="Rambursat" v={formatPrice(o.refunded_cents, cur)} /> : null}
              <div className="flex justify-between gap-6 border-t border-line pt-3 text-lg font-semibold"><dt>{paid ? "Total plătit" : "Total de plată"}</dt><dd>{formatPrice(o.total_cents, cur)}</dd></div>
              {o.discount_cents > 0 ? <p className="pt-1 text-right text-xs font-semibold text-gold">Ai economisit {formatPrice(o.discount_cents, cur)}</p> : null}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Plată">
            <dl>
              <Row k="Metodă" v={method} />
              <Row k="Status" v={statusLabel[o.status] ?? o.status} />
              {o.paid_at ? <Row k="Data plății" v={formatDate(o.paid_at)} /> : null}
              {o.invoice_number ? <Row k="Factură" v={o.invoice_number} /> : null}
            </dl>
          </Card>

          <Card title="Date de facturare">
            {o.billing?.name ? (
              <address className="text-sm not-italic leading-relaxed">
                <p className="font-medium">{o.billing.name}</p>
                {o.billing.cui ? <p className="text-muted">CUI {o.billing.cui}{o.billing.reg_com ? `, ${o.billing.reg_com}` : ""}</p> : null}
                <p className="text-muted">{[o.billing.address, o.billing.city, o.billing.county].filter(Boolean).join(", ")}</p>
              </address>
            ) : <p className="text-sm text-muted">Nu există date de facturare salvate.</p>}
          </Card>

          <div className="flex flex-wrap gap-3 print:hidden">
            {paid ? <PrintButton /> : null}
            {o.invoice_number ? <a href={`/api/facturi/${o.id}`} className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-white">Descarcă factura (PDF)</a> : null}
            {paid && course ? <ButtonLink href={`/cont/cursuri/${course.slug}`} variant="ghost">Mergi la curs</ButtonLink> : null}
          </div>
          {paid ? <p className="text-xs text-muted">Pagina confirmă plata și nu înlocuiește factura fiscală.</p> : null}
        </div>
      </div>
    </div>
  );
}
