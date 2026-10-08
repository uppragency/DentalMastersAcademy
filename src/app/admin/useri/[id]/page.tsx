import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clearUserTier, revokeEnrollment, sendPasswordReset, toggleUserDisabled } from "@/actions/staff";
import { AnonymizeForm, EnrollForm, ManualOrderForm, NoteForm, PointsForm, ProfileEditForm, TierForm, TransferOrderForm } from "@/components/staff-forms";
import { Button } from "@/components/ui";
import { requireStaff } from "@/lib/staff";
import { formatDate, formatPrice } from "@/lib/format";
import { tierNames } from "@/lib/loyalty";
import { nowMs } from "@/lib/time";
import type { Tier } from "@/lib/types";

export const metadata: Metadata = { title: "Fișă user | Administrare", robots: { index: false } };

const statusLabel: Record<string, string> = { pending: "În așteptare", paid: "Plătită", failed: "Eșuată", refunded: "Rambursată", cancelled: "Anulată" };
const kindLabel: Record<string, string> = { earn: "Câștigate", redeem: "Folosite", restore: "Returnate", expire: "Expirate", adjust: "Ajustare" };

function Card({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-line bg-card p-7">
      <h2 id={id} className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin, isAdmin, profile: me } = await requireStaff();
  const { data: user } = await admin.from("profiles").select("id, email, full_name, phone, specialization, role, tier, created_at, disabled_at, referral_code").eq("id", id).maybeSingle();
  if (!user) notFound();

  const [{ data: courses }, { data: enrollments }, { data: orders }, { data: ledger }, { data: notes }, { data: override }, { data: grace }, { data: mails }] = await Promise.all([
    admin.from("courses").select("id, title").order("title"),
    admin.from("enrollments").select("id, source, created_at, courses(title, slug)").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("orders").select("id, status, source, total_cents, currency, created_at, order_items(courses(title))").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("points_ledger").select("id, kind, delta, remaining, expires_at, note, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(200),
    admin.from("user_notes").select("id, note, created_at, author:profiles!author_id(full_name, email)").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("tier_overrides").select("tier, until, reason").eq("user_id", id).eq("active", true).maybeSingle(),
    admin.from("tier_state").select("grace_until").eq("user_id", id).maybeSingle(),
    admin.from("email_log").select("id, subject, status, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
  ]);

  const now = nowMs();
  const rows = ledger ?? [];
  const balance = rows.filter((r) => r.remaining > 0 && (!r.expires_at || new Date(r.expires_at).getTime() > now)).reduce((s, r) => s + r.remaining, 0);
  const paid = (orders ?? []).filter((o) => o.status === "paid");
  const spent = paid.reduce((s, o) => s + o.total_cents, 0);
  const ov = override && (!override.until || new Date(override.until).getTime() > now) ? override : null;
  const disabled = Boolean(user.disabled_at);
  const isSelf = user.id === me.id;
  const canTarget = isAdmin && !isSelf;

  return (
    <div className="space-y-8">
      <Link href="/admin/useri" className="text-sm text-muted hover:text-foreground">← Useri</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{user.full_name ?? user.email}</h1>
          <p className="mt-1 text-sm text-muted">{user.email} · înregistrat {formatDate(user.created_at)}{disabled ? " · cont dezactivat" : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={sendPasswordReset.bind(null, id)}><Button type="submit" variant="ghost">Trimite resetare parolă</Button></form>
          {canTarget ? (
            <form action={toggleUserDisabled.bind(null, id, !disabled)}><Button type="submit" variant="ghost">{disabled ? "Reactivează contul" : "Dezactivează contul"}</Button></form>
          ) : null}
        </div>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Nivel", v: tierNames[user.tier as Tier] + (ov ? " (manual)" : "") },
          { k: "Puncte disponibile", v: String(balance) },
          { k: "Cursuri", v: String((enrollments ?? []).length) },
          { k: "Total plătit", v: formatPrice(spent, "EUR") },
        ].map((s) => (
          <div key={s.k} className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">{s.k}</dt><dd className="mt-2 text-2xl font-semibold">{s.v}</dd></div>
        ))}
      </dl>
      {grace?.grace_until && new Date(grace.grace_until).getTime() > now ? (
        <p className="rounded-2xl bg-gold-soft px-5 py-3 text-sm">Nivelul este în perioadă de grație până la {formatDate(grace.grace_until)}.</p>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-2">
        <Card title="Date cont" id="date">
          <ProfileEditForm userId={id} profile={user} canRole={canTarget} />
        </Card>
        <Card title="Note interne" id="note">
          <NoteForm userId={id} />
          {(notes ?? []).length > 0 ? (
            <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              {(notes ?? []).map((n) => {
                const a = n.author as unknown as { full_name: string | null; email: string } | null;
                return (
                  <li key={n.id}>
                    <p>{n.note}</p>
                    <p className="text-xs text-muted">{formatDate(n.created_at)}{a ? ` · ${a.full_name ?? a.email}` : ""}</p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Card>
      </div>

      <Card title="Cursuri înscrise" id="cursuri">
        {(enrollments ?? []).length > 0 ? (
          <ul className="divide-y divide-line text-sm">
            {(enrollments ?? []).map((e) => {
              const c = e.courses as unknown as { title: string; slug: string } | null;
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span><span className="font-medium">{c?.title}</span><span className="ml-3 text-muted">{formatDate(e.created_at)} · {e.source === "purchase" ? "cumpărat" : e.source === "gold_free" ? "acces Gold" : "adăugat de admin"}</span></span>
                  {isAdmin ? <form action={revokeEnrollment.bind(null, id, e.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">Retrage</Button></form> : null}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted">Nicio înscriere.</p>}
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="mb-4 font-medium">Înscrie fără plată</h3>
          <EnrollForm userId={id} courses={courses ?? []} />
        </div>
      </Card>

      <Card title="Comenzi" id="comenzi">
        {(orders ?? []).length > 0 ? (
          <ul className="divide-y divide-line text-sm">
            {(orders ?? []).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/admin/comenzi/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                  {(o.order_items as unknown as { courses: { title: string } | null }[]).map((i) => i.courses?.title).filter(Boolean).join(", ") || "Comandă"}
                </Link>
                <span className="text-muted">{formatDate(o.created_at)} · {formatPrice(o.total_cents, o.currency.trim())} · {statusLabel[o.status] ?? o.status}{o.source === "manual" ? " · manuală" : ""}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Nicio comandă.</p>}
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="mb-4 font-medium">Adaugă comandă manuală</h3>
          <ManualOrderForm userId={id} courses={courses ?? []} />
        </div>
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="mb-4 font-medium">Comandă prin transfer bancar (în așteptarea plății)</h3>
          <TransferOrderForm userId={id} courses={courses ?? []} />
        </div>
      </Card>

      {(mails ?? []).length > 0 ? (
        <Card title="Emailuri trimise" id="emailuri">
          <ul className="divide-y divide-line text-sm">
            {(mails ?? []).map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-3 py-2"><span>{m.subject}</span><span className="text-muted">{formatDate(m.created_at)} · {m.status}</span></li>
            ))}
          </ul>
          <Link href={`/admin/emailuri?q=${encodeURIComponent(user.email)}`} className="mt-4 inline-block text-sm underline underline-offset-4">Vezi tot jurnalul</Link>
        </Card>
      ) : null}

      {isAdmin ? (
        <div className="grid gap-8 xl:grid-cols-2">
          <Card title="Nivel manual" id="nivel">
            {ov ? (
              <div className="mb-6 rounded-2xl bg-gold-soft px-5 py-4 text-sm">
                <p>Setat manual: <strong>{tierNames[ov.tier as Tier]}</strong>{ov.until ? ` până la ${formatDate(ov.until)}` : ", fără expirare"}. Motiv: {ov.reason}</p>
                <form action={clearUserTier.bind(null, id)} className="mt-3"><Button type="submit" variant="ghost" className="min-h-9 px-4">Elimină nivelul manual</Button></form>
              </div>
            ) : <p className="mb-6 text-sm text-muted">Nivelul se calculează automat din achiziții. Setarea manuală are prioritate și se poate programa să expire.</p>}
            <TierForm userId={id} />
          </Card>
          <Card title="Puncte" id="puncte">
            <PointsForm userId={id} />
            {rows.length > 0 ? (
              <ul className="mt-6 max-h-72 space-y-2 overflow-y-auto border-t border-line pt-5 text-sm">
                {rows.slice(0, 30).map((r) => (
                  <li key={r.id} className="flex justify-between gap-3"><span className="text-muted">{formatDate(r.created_at)} · {kindLabel[r.kind]}{r.note ? ` · ${r.note}` : ""}</span><span className="font-semibold">{r.delta > 0 ? "+" : ""}{r.delta}</span></li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>
      ) : null}

      {canTarget ? (
        <Card title="Anonimizare (GDPR)" id="gdpr"><AnonymizeForm userId={id} /></Card>
      ) : null}
    </div>
  );
}
