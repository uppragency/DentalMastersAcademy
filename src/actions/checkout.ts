"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, paymentsEnabled } from "@/lib/stripe";
import type { FormState } from "@/actions/auth";

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
  accept_terms: z.literal("on", { error: "Trebuie să accepți termenii și condițiile." }),
});

export async function startCheckout(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!paymentsEnabled()) return { message: "Plata online nu este încă activată. Încearcă din nou în curând." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  let userId = claims?.claims?.sub ?? null;
  let newAccount = false;
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, slug, title, currency, status")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return { message: "Cursul nu mai este disponibil." };

  if (!userId) {
    const parsed = guestSchema.safeParse({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      specialization: formData.get("specialization") || undefined,
      password: formData.get("password"),
      accept_terms: formData.get("accept_terms"),
    });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

    const { email, password, accept_terms: _t, ...meta } = parsed.data;
    void _t;
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

  const { data: rows, error: orderError } = await admin.rpc("create_order_for_course", { p_user: userId, p_course: courseId });
  if (orderError) {
    if (orderError.message.includes("already_enrolled")) redirect(`/cont/cursuri/${course.slug}`);
    return { message: "Comanda nu a putut fi creată. Încearcă din nou." };
  }
  const order = (rows as { order_id: string | null; total_cents: number; currency: string; is_free: boolean }[])[0];
  if (!order) return { message: "Comanda nu a putut fi creată." };
  if (order.is_free || !order.order_id) redirect(`/cont/cursuri/${course.slug}`);

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
    success_url: `${origin}/cont?plata=succes`,
    cancel_url: `${origin}/cursuri/${course.slug}?plata=anulata`,
  });

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.order_id);
  if (!session.url) return { message: "Nu am putut inițializa plata. Încearcă din nou." };
  redirect(session.url);
}
