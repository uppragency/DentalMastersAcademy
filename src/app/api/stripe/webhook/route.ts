import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { issueInvoice } from "@/lib/invoicing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" && session.metadata?.order_id) {
      const admin = createAdminClient();
      const orderId = session.metadata.order_id;
      const { data: fulfilled, error } = await admin.rpc("fulfill_order", {
        p_order: orderId,
        p_session: session.id,
        p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
      if (error) {
        console.error("fulfill_order failed", error);
        return NextResponse.json({ error: "fulfill_failed" }, { status: 500 }); // Stripe retries
      }

      if (fulfilled) {
        const { data: order } = await admin
          .from("orders")
          .select("total_cents, currency, profiles(email, full_name), order_items(courses(title, slug))")
          .eq("id", orderId)
          .single();
        const row = order as unknown as {
          total_cents: number;
          currency: string;
          profiles: { email: string; full_name: string | null } | null;
          order_items: { courses: { title: string; slug: string } | null }[];
        } | null;
        const profile = row?.profiles;
        const course = row?.order_items?.[0]?.courses;
        if (row && profile && course) {
          await sendPurchaseEmail({
            to: profile.email,
            name: profile.full_name,
            courseTitle: course.title,
            courseSlug: course.slug,
            totalFormatted: formatPrice(row.total_cents, row.currency.trim()),
            newAccount: session.metadata.new_account === "1",
          });
        }
        await issueInvoice(orderId);
      }
    }
  }
  return NextResponse.json({ received: true });
}
