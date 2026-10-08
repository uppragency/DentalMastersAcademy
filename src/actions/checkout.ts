"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, paymentsEnabled } from "@/lib/stripe";
import type { FormState } from "@/actions/auth";
import { courseMethods, transferDeadline, type PayMethod } from "@/lib/transfer";
import { sendTransferInstructions } from "@/lib/orders-ops";
import { issueProforma } from "@/lib/invoicing";
import { readBilling, type BillingInput } from "@/lib/billing";

const guestSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Introdu numele complet." }).max(120),
  email: z.email({ error: "Introdu o adresă de email validă." }).trim().toLowerCase(),
  phone: z.string().trim().max(40).optional(),
  specialization: z.string().trim().max(120).optional(),
  password: z
    .string()
    .min(8, { error: "Parola trebuie să aibă minimum 8 caractere." })
    .regex(/[a-zA-Z]/, { error: "Parola trebuie să conțină o literă." })
    .regex(/[0-9]/, { error: "Parola trebuie să conțină o cifră." }),
});

export async function startCheckout(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  let userId = claims?.claims?.sub ?? null;
  let newAccount = false;
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, slug, title, currency, status, starts_at, ends_at, registration_opens_at, payment_methods")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return { message: "Cursul nu mai este disponibil." };
  const method: PayMethod = formData.get("payment_method") === "transfer" ? "transfer" : "card";
  if (!courseMethods(course.payment_methods).includes(method)) return { message: "Metoda de plată aleasă nu este disponibilă pentru acest curs." };
  const endRef = course.ends_at ?? course.starts_at;
  if (endRef && new Date(endRef).getTime() < Date.now()) return { message: "Înscrierile pentru această ediție sunt închise. Scrie-ne pentru următoarea ediție." };
  if (course.registration_opens_at && new Date(course.registration_opens_at).getTime() > Date.now()) return { message: "Înscrierile pentru această ediție nu s-au deschis încă." };

  // Billing details: a saved profile (owned by the signed-in user) or the submitted fields.
  const savedId = formData.get("billing_profile_id");
  let billing: BillingInput | null = null;
  let billingFieldErrors: Record<string, string[]> | undefined;
  if (userId && typeof savedId === "string" && savedId && formData.get("billing_mode") === "saved") {
    const { data: saved } = await admin
      .from("billing_profiles")
      .select("kind, name, cui, reg_com, address, city, county")
      .eq("id", savedId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!saved) return { message: "Profilul de facturare selectat nu a fost găsit." };
    billing = { ...saved, cui: saved.cui ?? "", reg_com: saved.reg_com ?? undefined } as BillingInput;
  } else {
    const parsedBilling = readBilling(formData);
    if (!parsedBilling.success) {
      const fe = z.flattenError(parsedBilling.error).fieldErrors as Record<string, string[]>;
      billingFieldErrors = Object.fromEntries(Object.entries(fe).map(([k, v]) => [`billing_${k}`, v]));
    } else billing = parsedBilling.data;
  }

  if (!userId) {
    const parsed = guestSchema.safeParse({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      specialization: formData.get("specialization") || undefined,
      password: formData.get("password"),
    });
    if (!parsed.success || billingFieldErrors) {
      return { errors: { ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors), ...billingFieldErrors } };
    }

    const { email, password, ...meta } = parsed.data;
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    if (createError) {
      const exists = /already|registered|exists/i.test(createError.message);
      return {
        message: exists
          ? "Există deja un cont cu acest email. Intră în cont pentru a continua achiziția."
          : "Nu am putut crea contul. Încearcă din nou.",
      };
    }
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user) return { message: "Contul a fost creat, dar autentificarea a eșuat. Intră în cont și reia comanda." };
    userId = signedIn.user.id;
    newAccount = true;
  }

  if (!billing) return { errors: billingFieldErrors };

  // Signed-in buyers can add a missing phone or specialization; never overwrite what the profile already has.
  if (!newAccount) {
    const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
    const spec = String(formData.get("specialization") ?? "").trim().slice(0, 120);
    if (phone || spec) {
      const { data: cur } = await admin.from("profiles").select("phone, specialization").eq("id", userId).maybeSingle();
      const patch: { phone?: string; specialization?: string } = {};
      if (phone && !cur?.phone) patch.phone = phone;
      if (spec && !cur?.specialization) patch.specialization = spec;
      if (Object.keys(patch).length) await admin.from("profiles").update(patch).eq("id", userId);
    }
  }

  if (method === "transfer") {
    // One active transfer reservation per course: show the existing one instead of creating a duplicate.
    const { data: existing } = await admin
      .from("orders")
      .select("id, order_items!inner(course_id)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("source", "transfer")
      .eq("order_items.course_id", courseId)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (existing) redirect(`/multumim/${existing.id}`);
  }

  const rawCode = formData.get("discount_code");
  const code = typeof rawCode === "string" && rawCode.trim() ? rawCode.trim().slice(0, 40) : null;
  const rawPoints = Number(formData.get("points") ?? 0);
  const points = Number.isFinite(rawPoints) ? Math.max(0, Math.min(1_000_000, Math.floor(rawPoints))) : 0;
  const { data: rows, error: orderError } = await admin.rpc("create_order_with_points", { p_user: userId, p_course: courseId, p_code: code, p_points: points });
  if (orderError) {
    const m = orderError.message;
    if (m.includes("already_enrolled")) redirect(`/cont/cursuri/${course.slug}`);
    if (m.includes("invalid_code")) return { message: "Codul de reducere nu este valid sau a expirat." };
    if (m.includes("sold_out")) return { message: "Locurile pentru această ediție s-au epuizat. Te putem anunța la următoarea ediție." };
    if (m.includes("registration_closed")) return { message: "Înscrierile pentru această ediție sunt închise." };
    if (m.includes("registration_not_open")) return { message: "Înscrierile pentru această ediție nu s-au deschis încă." };
    return { message: "Comanda nu a putut fi creată. Încearcă din nou." };
  }
  const order = (rows as { order_id: string | null; total_cents: number; currency: string; is_free: boolean }[])[0];
  if (!order) return { message: "Comanda nu a putut fi creată." };
  if (order.is_free || !order.order_id) redirect(`/multumim/gratuit/${course.slug}`);

  await admin.from("orders").update({ billing }).eq("id", order.order_id);
  if (formData.get("billing_save") === "on" && formData.get("billing_mode") !== "saved") {
    await admin.from("billing_profiles").insert({
      user_id: userId,
      kind: billing.kind,
      name: billing.name,
      cui: billing.kind === "company" ? billing.cui : null,
      reg_com: billing.kind === "company" ? (billing.reg_com ?? null) : null,
      address: billing.address,
      city: billing.city,
      county: billing.county,
    });
  }

  if (method === "transfer") {
    await admin.from("orders").update({ source: "transfer", expires_at: transferDeadline().toISOString() }).eq("id", order.order_id);
    try {
      await sendTransferInstructions(order.order_id);
      await issueProforma(order.order_id);
    } catch {
      /* the thank-you page shows the same details; the admin can resend */
    }
    redirect(`/multumim/${order.order_id}`);
  }

  if (!paymentsEnabled()) return { message: "Plata online nu este încă activată. Încearcă din nou în curând." };
  const stripe = getStripe()!;
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { data: profile } = await admin.from("profiles").select("email").eq("id", userId).single();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: profile?.email,
    client_reference_id: order.order_id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.trim().toLowerCase(),
          unit_amount: order.total_cents,
          product_data: { name: course.title },
        },
      },
    ],
    metadata: { order_id: order.order_id, new_account: newAccount ? "1" : "0" },
    success_url: `${origin}/multumim/${order.order_id}`,
    cancel_url: `${origin}/cursuri/${course.slug}?plata=anulata`,
    expires_at: Math.floor(Date.now() / 1000) + 2 * 3600,
  });

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.order_id);
  if (!session.url) return { message: "Nu am putut inițializa plata. Încearcă din nou." };
  redirect(session.url);
}
