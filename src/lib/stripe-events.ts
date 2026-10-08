import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { issueInvoice } from "@/lib/invoicing";

export const handledEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "charge.refunded"];

/** After a card payment succeeds, a still-pending bank transfer order for the same course is no longer needed. */
async function cancelOtherPendingOrders(paidOrderId: string) {
  const admin = createAdminClient();
  const { data: paid } = await admin.from("orders").select("user_id, order_items(course_id)").eq("id", paidOrderId).maybeSingle();
  const courseIds = ((paid?.order_items ?? []) as { course_id: string }[]).map((i) => i.course_id);
  if (!paid || courseIds.length === 0) return;
  const { data: others } = await admin
    .from("orders")
    .select("id, order_items!inner(course_id)")
    .eq("user_id", paid.user_id)
    .eq("status", "pending")
    .neq("id", paidOrderId)
    .in("order_items.course_id", courseIds);
  const ids = (others ?? []).map((o) => o.id);
  if (ids.length) await admin.from("orders").update({ status: "cancelled" }).in("id", ids).eq("status", "pending");
}

export type EventResult = { status: "processed" | "ignored" | "failed"; error?: string };

/** Applies one Stripe event. Idempotent: fulfill_order and the refund RPC both guard on order status. */
export async function processStripeEvent(event: Stripe.Event): Promise<EventResult> {
  const admin = createAdminClient();

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid" || !session.metadata?.order_id) return { status: "ignored" };
    const orderId = session.metadata.order_id;
    const { data: fulfilled, error } = await admin.rpc("fulfill_order", {
      p_order: orderId,
      p_session: session.id,
      p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
    });
    if (error) return { status: "failed", error: `fulfill_order: ${error.message}` };
    if (fulfilled) {
      const { data: order } = await admin
        .from("orders")
        .select("total_cents, currency, profiles!orders_user_id_fkey(email, full_name), order_items(courses(title, slug))")
        .eq("id", orderId)
        .single();
      const row = order as unknown as {
        total_cents: number;
        currency: string;
        profiles: { email: string; full_name: string | null } | null;
        order_items: { courses: { title: string; slug: string } | null }[];
      } | null;
      const course = row?.order_items?.[0]?.courses;
      if (row && row.profiles && course) {
        await sendPurchaseEmail({
          to: row.profiles.email,
          name: row.profiles.full_name,
          courseTitle: course.title,
          courseSlug: course.slug,
          totalFormatted: formatPrice(row.total_cents, row.currency.trim()),
          newAccount: session.metadata.new_account === "1",
        });
      }
      await issueInvoice(orderId);
      await cancelOtherPendingOrders(orderId);
    }
    return { status: "processed" };
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (!pi || !charge.refunded) return { status: "ignored" };
    const { data: order } = await admin.from("orders").select("id, status").eq("stripe_payment_intent", pi).maybeSingle();
    if (!order || order.status !== "paid") return { status: "ignored" };
    await admin.from("enrollments").delete().eq("order_id", order.id);
    const { error } = await admin.rpc("admin_refund_order", { p_order: order.id, p_reason: "Rambursare din Stripe", p_by: null });
    if (error) return { status: "failed", error: `admin_refund_order: ${error.message}` };
    return { status: "processed" };
  }

  return { status: "ignored" };
}
