import { courseMethods, formatDeadline, transferDeadline } from "@/lib/transfer";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { CourseImage } from "@/components/course-image";
import { CheckoutForm } from "@/components/checkout-form";
import { OrderSummary } from "@/components/order-summary";
import { createClient } from "@/lib/supabase/server";
import type { BillingProfile } from "@/lib/billing";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getPendingTransfer, getLoyaltySettings } from "@/lib/data";
import { formatDateRange, isEnded, isNotOpen } from "@/lib/format";
import { tierPerks } from "@/lib/loyalty";
import { nowMs } from "@/lib/time";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Finalizare comandă", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  const perk = tierPerks(profile?.tier ?? "standard", loyalty);
  if (isEnded(course, nowMs()) || isNotOpen(course, nowMs(), perk.earlyMs)) redirect(`/cursuri/${slug}`);
  const refCode = (await cookies()).get("dma_ref")?.value ?? "";

  let billingProfiles: BillingProfile[] = [];
  if (profile) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("billing_profiles")
      .select("id, kind, name, cui, reg_com, address, city, county, country")
      .order("created_at", { ascending: false });
    billingProfiles = (data ?? []) as BillingProfile[];
  }
  if (profile && (await getEnrolledCourseIds(profile.id)).includes(course.id)) redirect(`/cont/cursuri/${slug}`);
  // An unpaid bank transfer reservation: the buyer can only switch to card here (the transfer order is cancelled once the card payment succeeds).
  const pendingTransfer = profile ? await getPendingTransfer(profile.id, course.id) : null;
  let methods = courseMethods(course.payment_methods);
  if (pendingTransfer) {
    if (!methods.includes("card")) redirect(`/multumim/${pendingTransfer.id}`);
    methods = ["card"];
  }

  const discount = perk.discountPercent;
  const total = Math.round(course.price_cents * (1 - discount / 100));
  const free = Boolean(perk.member && course.gold_free) || total === 0;
  let pointsBalance = 0;
  if (profile && loyalty?.is_active && !free) {
    const supabase = await createClient();
    const { data: rows } = await supabase.from("points_ledger").select("remaining, expires_at").gt("remaining", 0);
    pointsBalance = (rows ?? []).filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > nowMs()).reduce((s, r) => s + r.remaining, 0);
  }

  return (
    <div className="bg-background">
      <div className="grain relative overflow-hidden bg-ink text-white">
        <Container className="py-6 sm:py-8">
          <h1 className="sr-only">Finalizare comandă: {course.title}</h1>
          <ol aria-label="Pașii comenzii" className="flex items-center gap-3 text-sm sm:gap-5">
            {["Date", "Plată", "Confirmare"].map((label, i) => (
              <li key={label} className="flex items-center gap-3 sm:gap-5" aria-current={i === 0 ? "step" : undefined}>
                <span className={`flex items-center gap-2.5 ${i === 0 ? "text-white" : "text-white/45"}`}>
                  <span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${i === 0 ? "bg-gold-bright text-ink" : "border border-white/25"}`}>{i + 1}</span>
                  <span className="font-medium">{label}</span>
                </span>
                {i < 2 ? <span aria-hidden="true" className="h-px w-6 bg-white/25 sm:w-12" /> : null}
              </li>
            ))}
          </ol>
        </Container>
      </div>
      <Container className="grid gap-8 py-10 pb-28 lg:grid-cols-[1fr_26rem] lg:py-16 lg:pb-16">
        <section className="rounded-[2rem] border border-line bg-card p-8 sm:p-10" aria-label="Date comandă">
          <CheckoutForm
            courseId={course.id}
            signedIn={Boolean(profile)}
            enabled={paymentsEnabled()}
            free={free}
            next={`/cursuri/${slug}/achizitie`}
            billingProfiles={billingProfiles}
            defaultName={profile?.full_name ?? ""}
            methods={methods}
            pendingTransfer={pendingTransfer ? { id: pendingTransfer.id, deadlineLabel: formatDeadline(pendingTransfer.expires_at) } : null}
            deadlineLabel={formatDeadline(transferDeadline())}
            missingProfile={{ phone: Boolean(profile) && !profile?.phone, specialization: Boolean(profile) && !profile?.specialization }}
          />
        </section>
        <aside className="h-fit overflow-hidden rounded-[2rem] border border-line bg-card lg:sticky lg:top-28" id="sumar-comanda" aria-label="Sumar comandă">
          <div className="relative aspect-[16/9] bg-ink"><CourseImage course={course} variant="thumb" sizes="(min-width: 1024px) 400px, 100vw" className="size-full" /></div>
          <div className="p-7">
            <h2 className="font-display text-2xl leading-snug">{course.title}</h2>
            <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}</p>
            <ul aria-label="Ce primești" className="mt-4 space-y-2 text-sm">
              {(course.format === "online"
                ? ["Acces la lecții în contul tău", "Progresul tău se salvează automat"]
                : ["Adeverință de participare cu număr unic verificabil", "Materiale disponibile 12 luni după curs", ...(course.capacity ? [`Grup de maximum ${course.capacity} participanți`] : [])]
              ).map((t) => (
                <li key={t} className="flex gap-2.5"><span aria-hidden="true" className="text-gold">✓</span><span>{t}</span></li>
              ))}
            </ul>
            <OrderSummary
              courseId={course.id}
              priceCents={course.price_cents}
              currency={course.currency}
              tierName={perk.name}
              tierPercent={discount}
              free={free}
              defaultCode={refCode}
              pointsBalance={pointsBalance}
              pointValueCents={Number(loyalty?.point_value_cents ?? 5)}
              capPercent={perk.capPercent}
            />
            <p className="mt-5 text-xs leading-relaxed text-muted">Plată securizată prin Stripe. Datele cardului nu trec prin serverele noastre.</p>
          </div>
        </aside>
      </Container>
    </div>
  );
}
