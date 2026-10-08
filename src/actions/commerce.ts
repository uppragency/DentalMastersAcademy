"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/actions/auth";

export type DiscountPreview = { ok: boolean; message: string; discountCents?: number; label?: string };

/** Read-only preview of what the checkout RPC will apply. The RPC stays the source of truth. */
export async function previewDiscount(courseId: string, rawCode: string): Promise<DiscountPreview> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: "Introdu un cod." };
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  const { data: course } = await admin.from("courses").select("id, price_cents").eq("id", courseId).eq("status", "published").maybeSingle();
  if (!course) return { ok: false, message: "Cursul nu mai este disponibil." };
  const { data: settings } = await admin.from("loyalty_settings").select("*").maybeSingle();

  let goldDisc = 0;
  if (userId && settings?.is_active) {
    const { data: p } = await admin.from("profiles").select("tier").eq("id", userId).maybeSingle();
    if (p?.tier === "gold") goldDisc = Math.round((course.price_cents * Number(settings.gold_discount_percent)) / 100);
  }

  const nowIso = new Date().toISOString();
  const { data: dc } = await admin.from("discount_codes").select("*").ilike("code", code).eq("active", true).maybeSingle();
  let disc = 0;
  let label = code;
  if (dc) {
    const valid =
      (!dc.starts_at || dc.starts_at <= nowIso) &&
      (!dc.expires_at || dc.expires_at > nowIso) &&
      (!dc.course_id || dc.course_id === courseId) &&
      (dc.max_uses === null || dc.used_count < dc.max_uses) &&
      (!dc.owner_user_id || dc.owner_user_id === userId);
    if (!valid) return { ok: false, message: "Codul nu este valid pentru acest curs sau a expirat." };
    disc = dc.kind === "percent" ? Math.round((course.price_cents * dc.value) / 100) : Math.min(dc.value, course.price_cents);
  } else {
    const { data: ref } = await admin.from("profiles").select("id").eq("referral_code", code).maybeSingle();
    if (!ref || ref.id === userId) return { ok: false, message: "Codul nu a fost găsit." };
    if (userId) {
      const { count } = await admin.from("enrollments").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("source", "purchase");
      if ((count ?? 0) > 0) return { ok: false, message: "Codul de recomandare se aplică doar la prima achiziție." };
    }
    disc = Math.round((course.price_cents * Number(settings?.referral_friend_percent ?? 0)) / 100);
    label = "Recomandare";
    if (disc <= 0) return { ok: false, message: "Codul nu este activ momentan." };
  }
  if (disc <= goldDisc) return { ok: false, message: "Reducerea Gold din contul tău este deja mai avantajoasă. Reducerile nu se cumulează." };
  return { ok: true, message: "Cod aplicat.", discountCents: disc, label };
}

const waitSchema = z.object({
  name: z.string().trim().min(2, { error: "Introdu numele." }).max(120),
  email: z.email({ error: "Introdu o adresă de email validă." }).trim().toLowerCase(),
  phone: z.string().trim().max(40).optional(),
  desired_course: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional(),
});

export async function joinWaitlist(courseId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const parsed = waitSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    desired_course: formData.get("desired_course") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  if (parsed.data.website) return { message: "Te-ai înscris pe lista de așteptare." };
  const { website: _hp, ...row } = parsed.data;
  void _hp;
  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").insert({ ...row, course_id: courseId });
  if (error && error.code !== "23505") return { message: "Nu am putut salva cererea. Încearcă din nou." };
  return { message: "Te-ai înscris pe lista de așteptare. Îți scriem imediat ce se deschid înscrierile." };
}
