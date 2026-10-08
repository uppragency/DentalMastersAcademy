import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui";
import { CheckoutForm } from "@/components/checkout-form";
import { getCourseBySlug, getCurrentProfile, getEnrolledCourseIds, getLoyaltySettings } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { paymentsEnabled } from "@/lib/stripe";

export const metadata: Metadata = { title: "Finalizare comandă", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, profile, loyalty] = await Promise.all([getCourseBySlug(slug), getCurrentProfile(), getLoyaltySettings()]);
  if (!course) notFound();
  if (profile && (await getEnrolledCourseIds(profile.id)).includes(course.id)) redirect(`/cont/cursuri/${slug}`);

  const isGold = profile?.tier === "gold" && loyalty?.is_active;
  const discount = isGold ? Number(loyalty!.gold_discount_percent) : 0;
  const total = Math.round(course.price_cents * (1 - discount / 100));
  const free = Boolean(isGold && course.gold_free) || total === 0;

  return (
    <Container className="max-w-4xl py-16">
      <Eyebrow>Finalizare comandă</Eyebrow>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Înscriere la curs</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_20rem]">
        <section className="rounded-3xl border border-line bg-card p-7" aria-label="Date comandă">
          <CheckoutForm
            courseId={course.id}
            signedIn={Boolean(profile)}
            enabled={paymentsEnabled()}
            free={free}
            next={`/cursuri/${slug}/achizitie`}
          />
        </section>
        <aside className="h-fit rounded-3xl border border-line bg-card p-7" aria-label="Sumar comandă">
          <h2 className="text-lg font-semibold leading-snug">{course.title}</h2>
          <p className="mt-1 text-sm text-muted">{formatDate(course.starts_at)}</p>
          <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Preț</dt><dd>{formatPrice(course.price_cents, course.currency)}</dd></div>
            {discount > 0 ? (
              <div className="flex justify-between text-gold"><dt>Reducere Gold {discount}%</dt><dd>−{formatPrice(course.price_cents - total, course.currency)}</dd></div>
            ) : null}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt><dd>{free ? "Gratuit" : formatPrice(total, course.currency)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </Container>
  );
}
