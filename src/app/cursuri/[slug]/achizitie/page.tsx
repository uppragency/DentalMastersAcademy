import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { CourseArt } from "@/components/course-art";
import { CheckoutForm } from "@/components/checkout-form";
import { OrderSummary } from "@/components/order-summary";
import { createClient } from "@/lib/supabase/server";
import type { BillingProfile } from "@/lib/billing";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings } from "@/lib/data";
import { formatDateRange, formatPrice, isEnded, isNotOpen } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Finalizare comandă", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  if (isEnded(course, nowMs()) || isNotOpen(course, nowMs())) redirect(`/cursuri/${slug}`);
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

  const isGold = profile?.tier === "gold" && loyalty?.is_active;
  const discount = isGold ? Number(loyalty!.gold_discount_percent) : 0;
  const total = Math.round(course.price_cents * (1 - discount / 100));
  const free = Boolean(isGold && course.gold_free) || total === 0;

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
          <div className="relative aspect-[16/9] bg-ink"><CourseArt seed={course.slug} className="size-full" /></div>
          <div className="p-7">
            <h2 className="font-display text-2xl leading-snug">{course.title}</h2>
            <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}</p>
            <OrderSummary courseId={course.id} priceCents={course.price_cents} currency={course.currency} goldPercent={discount} free={free} defaultCode={refCode} />
            <p className="mt-5 text-xs leading-relaxed text-muted">Plată securizată prin Stripe. Datele cardului nu trec prin serverele noastre.</p>
          </div>
        </aside>
      </Container>
    </div>
  );
}
