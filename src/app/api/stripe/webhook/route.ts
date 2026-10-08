import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { handledEvents, processStripeEvent } from "@/lib/stripe-events";

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
  if (!handledEvents.includes(event.type)) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("stripe_events").select("status, attempts").eq("id", event.id).maybeSingle();
  if (existing?.status === "processed" || existing?.status === "ignored") return NextResponse.json({ received: true });
  if (existing) await admin.from("stripe_events").update({ attempts: existing.attempts + 1 }).eq("id", event.id);
  else await admin.from("stripe_events").insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });

  let result: Awaited<ReturnType<typeof processStripeEvent>>;
  try {
    result = await processStripeEvent(event);
  } catch (e) {
    result = { status: "failed", error: e instanceof Error ? e.message : "eroare necunoscută" };
  }
  await admin.from("stripe_events").update({ status: result.status, error: result.error ?? null, processed_at: new Date().toISOString() }).eq("id", event.id);
  if (result.status === "failed") {
    console.error("stripe event failed", event.id, result.error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 }); // Stripe retries
  }
  return NextResponse.json({ received: true });
}
