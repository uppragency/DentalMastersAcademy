import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { CourseImage } from "@/components/course-image";
import { CheckoutForm } from "@/components/checkout-form";
import { OrderSummary } from "@/components/order-summary";
import { createClient } from "@/lib/supabase/server";
import type { BillingProfile } from "@/lib/billing";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings } from "@/lib/data";
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
        <Container className="py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-bright">Finalizare comandă</p>
          <h1 className="font-display mt-4 text-5xl font-medium">Înscriere la curs</h1>
        </Container>
      </div>
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_26rem] lg:py-16">
        <section className="rounded-[2rem] border border-line bg-card p-8 sm:p-10" aria-label="Date comandă">
          <CheckoutForm
            courseId={course.id}
            signedIn={Boolean(profile)}
            enabled={paymentsEnabled()}
            free={free}
            next={`/cursuri/${slug}/achizitie`}
            billingProfiles={billingProfiles}
            defaultName={profile?.full_name ?? ""}
          />
        </section>
        <aside className="h-fit overflow-hidden rounded-[2rem] border border-line bg-card lg:sticky lg:top-28" aria-label="Sumar comandă">
          <div className="relative aspect-[16/9] bg-ink"><CourseImage course={course} variant="thumb" sizes="(min-width: 1024px) 400px, 100vw" className="size-full" /></div>
          <div className="p-7">
            <h2 className="font-display text-2xl leading-snug">{course.title}</h2>
            <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}</p>
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
