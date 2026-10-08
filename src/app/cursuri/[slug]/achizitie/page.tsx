import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { CourseArt } from "@/components/course-art";
import { CheckoutForm } from "@/components/checkout-form";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings } from "@/lib/data";
import { formatDateRange, formatPrice, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Finalizare comandă", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  if (isEnded(course, nowMs())) redirect(`/cursuri/${slug}`);
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
          />
        </section>
        <aside className="h-fit overflow-hidden rounded-[2rem] border border-line bg-card lg:sticky lg:top-28" aria-label="Sumar comandă">
          <div className="relative aspect-[16/9] bg-ink"><CourseArt seed={course.slug} className="size-full" /></div>
          <div className="p-7">
            <h2 className="font-display text-2xl leading-snug">{course.title}</h2>
            <p className="mt-1 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}</p>
            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Preț</dt><dd>{formatPrice(course.price_cents, course.currency)}</dd></div>
              {discount > 0 ? (
                <div className="flex justify-between text-gold"><dt>Reducere Gold {discount}%</dt><dd>−{formatPrice(course.price_cents - total, course.currency)}</dd></div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
                <dt>Total</dt><dd>{free ? "Gratuit" : formatPrice(total, course.currency)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-muted">Plată securizată prin Stripe. Datele cardului nu trec prin serverele noastre.</p>
          </div>
        </aside>
      </Container>
    </div>
  );
}
