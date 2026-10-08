import type { Metadata } from "next";
import Link from "next/link";
import { reprocessStripeEvent } from "@/actions/ops";
import { Button } from "@/components/ui";
import { requireFullAdmin } from "@/lib/staff";
import { formatDate } from "@/lib/format";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Stare sistem | Administrare", robots: { index: false } };

const env: { name: string; label: string; required: boolean }[] = [
  { name: "STRIPE_SECRET_KEY", label: "Stripe, cheie secretă", required: true },
  { name: "STRIPE_WEBHOOK_SECRET", label: "Stripe, secret webhook", required: true },
  { name: "RESEND_API_KEY", label: "Email, cheie Resend", required: true },
  { name: "RESEND_FROM", label: "Email, adresă expeditor", required: true },
  { name: "RESEND_WEBHOOK_SECRET", label: "Email, secret webhook (status livrare)", required: false },
  { name: "CRON_SECRET", label: "Sarcini zilnice, secret", required: true },
  { name: "SMARTBILL_EMAIL", label: "SmartBill, email", required: false },
  { name: "SMARTBILL_TOKEN", label: "SmartBill, token", required: false },
  { name: "SMARTBILL_CIF", label: "SmartBill, CIF", required: false },
  { name: "SMARTBILL_SERIES", label: "SmartBill, serie", required: false },
  { name: "SMARTBILL_TAX_NAME", label: "SmartBill, denumire TVA", required: false },
  { name: "SMARTBILL_TAX_PERCENT", label: "SmartBill, cotă TVA", required: false },
];

function Card({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "bad" | "ok" }) {
  return (
    <section className={`rounded-3xl border bg-card p-7 ${tone === "bad" ? "border-red-300" : "border-line"}`}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function SystemPage() {
  const { admin } = await requireFullAdmin();
  const now = nowMs();
  const week = new Date(now - 7 * 86_400_000).toISOString();
  const [{ data: runs }, { data: failedEvents }, { count: failedMails }, { count: invoiceErrors }, { count: stuck }, { data: alerts }] = await Promise.all([
    admin.from("cron_runs").select("id, ran_at, ok, summary, error").order("ran_at", { ascending: false }).limit(8),
    admin.from("stripe_events").select("id, type, error, attempts, created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(20),
    admin.from("email_log").select("id", { count: "exact", head: true }).in("status", ["failed", "bounced", "complained"]).gte("created_at", week),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid").not("invoice_error", "is", null),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending").eq("source", "stripe").lt("created_at", new Date(now - 26 * 3_600_000).toISOString()),
    admin.from("ops_alerts").select("key, kind, message, created_at").order("created_at", { ascending: false }).limit(15),
  ]);
  const last = runs?.[0];
  const stale = !last || now - Date.parse(last.ran_at) > 36 * 3_600_000;
  const missing = env.filter((e) => e.required && !process.env[e.name]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Stare sistem</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Verifică aici întâi când un client spune că „a plătit și nu are acces” sau „nu a primit emailul”. Sarcinile zilnice trimit un rezumat pe email către administratori când apare o problemă.</p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Webhook-uri Stripe eșuate", v: failedEvents?.length ?? 0, bad: (failedEvents?.length ?? 0) > 0 },
          { k: "Emailuri eșuate, 7 zile", v: failedMails ?? 0, bad: (failedMails ?? 0) > 0 },
          { k: "Facturi cu eroare", v: invoiceErrors ?? 0, bad: (invoiceErrors ?? 0) > 0 },
          { k: "Comenzi blocate peste 26 h", v: stuck ?? 0, bad: (stuck ?? 0) > 0 },
        ].map((s) => (
          <div key={s.k} className={`rounded-3xl border bg-card p-6 ${s.bad ? "border-red-300" : "border-line"}`}><dt className="text-sm text-muted">{s.k}</dt><dd className="mt-2 text-2xl font-semibold">{s.v}</dd></div>
        ))}
      </dl>

      <Card title="Sarcini zilnice (memento-uri, puncte, alerte)" tone={stale ? "bad" : "ok"}>
        {stale ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{last ? `Ultima rulare a fost ${formatDate(last.ran_at)}, acum peste 36 de ore.` : "Nu există nicio rulare înregistrată."} Verifică CRON_SECRET și programarea din vercel.json.</p> : null}
        <ul className="divide-y divide-line text-sm">
          {(runs ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{formatDate(r.ran_at)} · {r.ok ? "reușit" : "eșuat"}</span>
              <span className="text-muted">{r.error ?? (r.summary ? JSON.stringify(r.summary) : "")}</span>
            </li>
          ))}
          {(runs ?? []).length === 0 ? <li className="py-2 text-muted">Încă nu a rulat.</li> : null}
        </ul>
      </Card>

      <Card title="Evenimente Stripe eșuate" tone={(failedEvents?.length ?? 0) > 0 ? "bad" : "ok"}>
        {(failedEvents ?? []).length > 0 ? (
          <ul className="divide-y divide-line text-sm">
            {failedEvents!.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span><span className="font-medium">{e.type}</span><span className="block text-xs text-muted">{e.id} · {formatDate(e.created_at)} · {e.attempts} încercări</span><span className="block text-xs text-red-700">{e.error}</span></span>
                <form action={reprocessStripeEvent.bind(null, e.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">Reprocesează</Button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Niciun eveniment eșuat. Stripe reîncearcă automat de mai multe ori, iar plățile reușite sunt procesate o singură dată.</p>}
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="Configurare">
          <ul className="space-y-2 text-sm">
            {env.map((e) => {
              const ok = Boolean(process.env[e.name]);
              return <li key={e.name} className="flex justify-between gap-3"><span>{e.label}{e.required ? "" : " (opțional)"}</span><span className={ok ? "text-muted" : e.required ? "font-medium text-red-700" : "text-muted"}>{ok ? "setat" : "lipsește"}</span></li>;
            })}
          </ul>
          {missing.length > 0 ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">Lipsesc setări obligatorii: plățile sau emailurile pot să nu funcționeze.</p> : null}
        </Card>
        <Card title="Alerte recente">
          <ul className="divide-y divide-line text-sm">
            {(alerts ?? []).map((a) => <li key={a.key} className="py-2">{a.message}<span className="block text-xs text-muted">{formatDate(a.created_at)}</span></li>)}
            {(alerts ?? []).length === 0 ? <li className="py-2 text-muted">Nicio alertă. Primești alerte pentru cursuri aproape pline, cursuri cu puține înscrieri înainte de start și erori de sistem.</li> : null}
          </ul>
        </Card>
      </div>

      <p className="text-sm text-muted">
        <Link href="/admin/emailuri?status=failed" className="underline underline-offset-4">Emailuri eșuate</Link> · <Link href="/admin/abandonate" className="underline underline-offset-4">Comenzi neplătite</Link> · <Link href="/admin/jurnal" className="underline underline-offset-4">Jurnal modificări</Link>
      </p>
    </div>
  );
}
