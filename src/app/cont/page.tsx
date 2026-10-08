import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { getCurrentProfile, getLoyaltySettings, getMyEnrollments, getMyOrders } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Contul meu", robots: { index: false } };

const statusLabel: Record<string, string> = {
  pending: "În așteptare",
  paid: "Plătită",
  failed: "Eșuată",
  refunded: "Rambursată",
  cancelled: "Anulată",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ plata?: string }> }) {
  const { plata } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/cont");

  const [enrollments, orders, loyalty] = await Promise.all([
    getMyEnrollments(profile.id),
    getMyOrders(profile.id),
    getLoyaltySettings(),
  ]);
  const isGold = profile.tier === "gold";

  return (
    <Container className="py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Eyebrow>Contul meu</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{profile.full_name ?? profile.email}</h1>
          <p className="mt-1 text-muted">{profile.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {profile.role === "admin" ? <ButtonLink href="/admin" variant="ghost">Administrare</ButtonLink> : null}
          <form action={logout}><Button type="submit" variant="ghost">Ieși din cont</Button></form>
        </div>
      </div>

      {plata === "succes" ? (
        <p role="status" className="mt-8 rounded-2xl bg-gold-soft px-5 py-4 text-sm">
          Plata a fost primită. Cursul apare mai jos în câteva secunde; vei primi și un email de confirmare.
        </p>
      ) : null}

      <section aria-labelledby="status-title" className="mt-10">
        <div className={`rounded-3xl p-7 ${isGold ? "bg-ink text-white" : "border border-line bg-card"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isGold ? "text-[#d9b873]" : "text-gold"}`}>Status membru</p>
          <h2 id="status-title" className="mt-2 text-2xl font-semibold tracking-tight">{isGold ? "Gold" : "Standard"}</h2>
          <p className={`mt-2 max-w-xl text-sm leading-relaxed ${isGold ? "text-white/70" : "text-muted"}`}>
            {isGold
              ? `Beneficiezi de reducere ${Number(loyalty?.gold_discount_percent ?? 0)}% la cursurile viitoare și de acces gratuit la activitățile marcate Gold.`
              : "Statusul Gold se acordă automat pe baza istoricului tău de achiziții și aduce reduceri și acces gratuit la activități selectate."}
          </p>
        </div>
      </section>

      <section aria-labelledby="courses-title" className="mt-14">
        <h2 id="courses-title" className="text-2xl font-semibold tracking-tight">Cursuri plătite</h2>
        {enrollments.length > 0 ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {enrollments.map((e) =>
              e.courses ? (
                <li key={e.id} className="flex flex-col rounded-3xl border border-line bg-card p-6">
                  <h3 className="text-lg font-semibold leading-snug">{e.courses.title}</h3>
                  <p className="mt-1 text-sm text-muted">{formatDate(e.courses.starts_at)}</p>
                  <ButtonLink href={`/cont/cursuri/${e.courses.slug}`} className="mt-5 self-start">Accesează cursul</ButtonLink>
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <p className="mt-6 rounded-3xl border border-dashed border-line p-10 text-center text-muted">
            Nu ai încă cursuri achiziționate. <Link className="font-medium text-foreground underline underline-offset-4" href="/cursuri">Vezi catalogul</Link>
          </p>
        )}
      </section>

      <section aria-labelledby="orders-title" className="mt-14">
        <h2 id="orders-title" className="text-2xl font-semibold tracking-tight">Istoric achiziții</h2>
        {orders.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Curs</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-4">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-4">{o.order_items.map((i) => i.courses?.title).filter(Boolean).join(", ")}</td>
                    <td className="px-5 py-4 font-medium">{formatPrice(o.total_cents, o.currency.trim())}</td>
                    <td className="px-5 py-4">{statusLabel[o.status] ?? o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-muted">Nu există achiziții.</p>
        )}
      </section>
    </Container>
  );
}
