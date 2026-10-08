import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const statusByType: Record<string, string> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "delayed",
  "email.failed": "failed",
};

/** Verifies a Svix style signature (the scheme Resend webhooks use). */
function verify(body: string, id: string, timestamp: string, header: string, secret: string) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return header.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signature) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  const body = await request.text();
  if (!verify(body, id, timestamp, signature, secret)) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  let event: { type?: string; data?: { email_id?: string; bounce?: { message?: string }; reason?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const status = event.type ? statusByType[event.type] : undefined;
  const emailId = event.data?.email_id;
  if (status && emailId) {
    const error = status === "bounced" || status === "failed" ? event.data?.bounce?.message ?? event.data?.reason ?? null : null;
    const { error: dbError } = await createAdminClient().from("email_log").update({ status, error, updated_at: new Date().toISOString() }).eq("provider_id", emailId);
    if (dbError) return NextResponse.json({ error: "db" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
