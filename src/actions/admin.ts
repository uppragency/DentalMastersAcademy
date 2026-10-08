"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { FormState } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  return createClient();
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "YYYY-MM-DD" + hour in Europe/Bucharest to an ISO instant (handles DST). */
function bucharestIso(date: string, hour: number, minute = 0) {
  const guess = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  const localHour = Number(parts.find((p) => p.type === "hour")?.value ?? hour);
  let offset = localHour - hour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;
  return new Date(guess.getTime() - offset * 3_600_000).toISOString();
}

/** "HH:MM" to [hour, minute], falling back to the given default. */
function parseTime(v: string | undefined, fallback: [number, number]): [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v ?? "");
  if (!m) return fallback;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? [h, mi] : fallback;
}

/** Blocks separated by a blank line: first line = day title, next lines = "HH:MM text". */
function parseSchedule(v: string | undefined) {
  return (v ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length > 0)
    .map(([title, ...rest]) => ({
      title: title!,
      items: rest.map((l) => {
        const m = /^(\d{1,2}[:.]\d{2})\s*[-–:]?\s*(.*)$/.exec(l);
        return m ? { time: m[1]!.replace(".", ":"), text: m[2]! } : { time: "", text: l };
      }),
    }));
}

const lines = (v: string | undefined) => (v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

/** Blocks separated by a blank line: first line = title, next lines = items. */
function parseSections(v: string | undefined) {
  return (v ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean))
    .filter((b) => b.length > 0)
    .map(([title, ...items]) => ({ title: title!, items }));
}

const courseSchema = z.object({
  title: z.string().trim().min(3, { error: "Titlul este obligatoriu." }).max(200),
  slug: z.string().trim().max(80).optional(),
  category_id: z.string().uuid().optional(),
  summary: z.string().trim().max(500).optional(),
  description: z.string().trim().max(20000).optional(),
  syllabus: z.string().trim().max(20000).optional(),
  trainer_name: z.string().trim().max(160).optional(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  language: z.string().trim().max(60).optional(),
  currency: z.enum(["RON", "EUR"]),
  old_price: z.coerce.number().min(0).max(1_000_000).optional(),
  audience: z.string().max(5000).optional(),
  outcomes: z.string().max(5000).optional(),
  sections: z.string().max(20000).optional(),
  format: z.enum(["physical", "online", "hybrid"]),
  location: z.string().trim().max(200).optional(),
  price: z.coerce.number({ error: "Preț invalid." }).min(0).max(1_000_000),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(["draft", "published", "archived"]),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  schedule: z.string().max(10000).optional(),
  opens_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  promo_video_url: z.string().trim().url().startsWith("https://", { error: "Linkul trebuie să înceapă cu https://" }).optional(),
  faqs: z.string().max(10000).optional(),
  next_edition_of: z.string().uuid().optional(),
  parking_info: z.string().trim().max(500).optional(),
  bring_info: z.string().trim().max(500).optional(),
});

/** Blocks separated by a blank line: first line = question, rest = answer. */
function parseFaqs(v: string | undefined) {
  return (v ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length >= 2)
    .map(([q, ...a]) => ({ q: q!, a: a.join(" ") }));
}

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

export async function saveCourse(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: opt(formData.get("slug")),
    category_id: opt(formData.get("category_id")),
    summary: opt(formData.get("summary")),
    description: opt(formData.get("description")),
    syllabus: opt(formData.get("syllabus")),
    trainer_name: opt(formData.get("trainer_name")),
    starts_on: opt(formData.get("starts_on")),
    ends_on: opt(formData.get("ends_on")),
    language: opt(formData.get("language")),
    currency: formData.get("currency"),
    old_price: opt(formData.get("old_price")),
    audience: opt(formData.get("audience")),
    outcomes: opt(formData.get("outcomes")),
    sections: opt(formData.get("sections")),
    format: formData.get("format"),
    location: opt(formData.get("location")),
    price: formData.get("price"),
    capacity: opt(formData.get("capacity")),
    status: formData.get("status"),
    start_time: opt(formData.get("start_time")),
    end_time: opt(formData.get("end_time")),
    schedule: opt(formData.get("schedule")),
    opens_on: opt(formData.get("opens_on")),
    promo_video_url: opt(formData.get("promo_video_url")),
    faqs: opt(formData.get("faqs")),
    next_edition_of: opt(formData.get("next_edition_of")),
    parking_info: opt(formData.get("parking_info")),
    bring_info: opt(formData.get("bring_info")),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const d = parsed.data;
  const row = {
    title: d.title,
    slug: slugify(d.slug || d.title),
    category_id: d.category_id ?? null,
    summary: d.summary ?? null,
    description: d.description ?? null,
    syllabus: d.syllabus ?? null,
    trainer_name: d.trainer_name ?? null,
    starts_at: d.starts_on ? bucharestIso(d.starts_on, ...parseTime(d.start_time, [9, 0])) : null,
    ends_at: d.ends_on || d.starts_on ? bucharestIso((d.ends_on ?? d.starts_on)!, ...parseTime(d.end_time, [18, 0])) : null,
    schedule: parseSchedule(d.schedule),
    language: d.language ?? null,
    old_price_cents: d.old_price ? Math.round(d.old_price * 100) : null,
    audience: lines(d.audience),
    outcomes: lines(d.outcomes),
    sections: parseSections(d.sections),
    format: d.format,
    location: d.location ?? null,
    price_cents: Math.round(d.price * 100),
    currency: d.currency,
    capacity: d.capacity ?? null,
    status: d.status,
    registration_opens_at: d.opens_on ? bucharestIso(d.opens_on, 10) : null,
    promo_video_url: d.promo_video_url ?? null,
    faqs: parseFaqs(d.faqs),
    next_edition_of: d.next_edition_of ?? null,
    parking_info: d.parking_info ?? null,
    bring_info: d.bring_info ?? null,
    is_featured: formData.get("is_featured") === "on",
    gold_free: formData.get("gold_free") === "on",
  };

  const saved = id
    ? await supabase.from("courses").update(row).eq("id", id).select("id").maybeSingle()
    : await supabase.from("courses").insert(row).select("id").maybeSingle();
  if (saved.error || !saved.data) {
    return { message: saved.error?.code === "23505" ? "Există deja un curs cu acest slug." : "Cursul nu a putut fi salvat." };
  }
  if (row.status === "published" && row.next_edition_of) {
    await notifyWaitlist(row.next_edition_of, { title: row.title, slug: row.slug });
  }
  revalidatePath("/", "layout");
  redirect("/admin/cursuri");
}

/** Emails everyone on the waitlist of the previous edition once the new edition is published. */
async function notifyWaitlist(previousCourseId: string, next: { title: string; slug: string }) {
  const admin = createAdminClient();
  const { data: rows } = await admin.from("waitlist").select("id, email, name").eq("course_id", previousCourseId).is("notified_at", null);
  for (const w of rows ?? []) {
    const ok = await sendMail({
      to: w.email,
      subject: `S-au deschis înscrierile: ${next.title}`,
      heading: "Următoarea ediție este disponibilă",
      paragraphs: [`${w.name ? `Bună, ${w.name}.` : "Bună."} Ai cerut să fii anunțat. Înscrierile pentru ${next.title} sunt deschise.`],
      cta: { label: "Vezi cursul", href: `/cursuri/${next.slug}` },
    });
    if (ok) await admin.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", w.id);
  }
}

export async function deleteCourse(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    // Courses with orders/enrollments cannot be deleted: archive instead
    await supabase.from("courses").update({ status: "archived" }).eq("id", id);
  }
  revalidatePath("/", "layout");
  redirect("/admin/cursuri");
}

const testimonialSchema = z.object({
  author_name: z.string().trim().min(2, { error: "Introdu numele." }).max(120),
  author_title: z.string().trim().max(160).optional(),
  quote: z.string().trim().min(10, { error: "Testimonialul este prea scurt." }).max(1500),
});

export async function addTestimonial(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const parsed = testimonialSchema.safeParse({
    author_name: formData.get("author_name"),
    author_title: opt(formData.get("author_title")),
    quote: formData.get("quote"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const { error } = await supabase.from("testimonials").insert(parsed.data);
  if (error) return { message: "Testimonialul nu a putut fi salvat." };
  revalidatePath("/", "layout");
  return { message: "Testimonial adăugat." };
}

export async function toggleTestimonial(id: string, published: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("testimonials").update({ is_published: published }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteTestimonial(id: string) {
  const supabase = await requireAdmin();
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePath("/", "layout");
}

const num = (min = 0, max = 100000) => z.coerce.number().min(min).max(max);
const loyaltySchema = z.object({
  spend_ron: z.coerce.number().min(0).optional(),
  courses_threshold: z.coerce.number().int().min(0).optional(),
  window_days: z.coerce.number().int().min(0).optional(),
  gold_discount_percent: num(0, 100),
  platinum_spend: z.coerce.number().min(0).optional(),
  platinum_courses: z.coerce.number().int().min(0).optional(),
  platinum_discount_percent: num(0, 100),
  referral_friend_percent: num(0, 100),
  referral_reward_percent: num(0, 100),
  point_value_cents: num(0.01, 100000),
  points_expiry_months: z.coerce.number().int().min(1).max(120),
  points_multiplier_standard: num(0, 100),
  points_multiplier_gold: num(0, 100),
  points_multiplier_platinum: num(0, 100),
  points_cap_standard: num(0, 100),
  points_cap_gold: num(0, 100),
  points_cap_platinum: num(0, 100),
  early_access_hours: z.coerce.number().int().min(0).max(720),
  tier_grace_days: z.coerce.number().int().min(0).max(365),
});

export async function saveLoyalty(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const g = (k: string) => formData.get(k);
  const parsed = loyaltySchema.safeParse({
    spend_ron: opt(g("spend_ron")),
    courses_threshold: opt(g("courses_threshold")),
    window_days: opt(g("window_days")),
    gold_discount_percent: g("gold_discount_percent"),
    platinum_spend: opt(g("platinum_spend")),
    platinum_courses: opt(g("platinum_courses")),
    platinum_discount_percent: g("platinum_discount_percent"),
    referral_friend_percent: g("referral_friend_percent"),
    referral_reward_percent: g("referral_reward_percent"),
    point_value_cents: g("point_value_cents"),
    points_expiry_months: g("points_expiry_months"),
    points_multiplier_standard: g("points_multiplier_standard"),
    points_multiplier_gold: g("points_multiplier_gold"),
    points_multiplier_platinum: g("points_multiplier_platinum"),
    points_cap_standard: g("points_cap_standard"),
    points_cap_gold: g("points_cap_gold"),
    points_cap_platinum: g("points_cap_platinum"),
    early_access_hours: g("early_access_hours"),
    tier_grace_days: g("tier_grace_days"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const { error } = await supabase
    .from("loyalty_settings")
    .update({
      is_active: formData.get("is_active") === "on",
      spend_threshold_cents: d.spend_ron ? Math.round(d.spend_ron * 100) : null,
      courses_threshold: d.courses_threshold || null,
      window_days: d.window_days || null,
      gold_discount_percent: d.gold_discount_percent,
      platinum_spend_threshold_cents: d.platinum_spend ? Math.round(d.platinum_spend * 100) : null,
      platinum_courses_threshold: d.platinum_courses || null,
      platinum_discount_percent: d.platinum_discount_percent,
      referral_friend_percent: d.referral_friend_percent,
      referral_reward_percent: d.referral_reward_percent,
      point_value_cents: d.point_value_cents,
      points_expiry_months: d.points_expiry_months,
      points_multiplier_standard: d.points_multiplier_standard,
      points_multiplier_gold: d.points_multiplier_gold,
      points_multiplier_platinum: d.points_multiplier_platinum,
      points_cap_standard: d.points_cap_standard,
      points_cap_gold: d.points_cap_gold,
      points_cap_platinum: d.points_cap_platinum,
      early_access_hours: d.early_access_hours,
      tier_grace_days: d.tier_grace_days,
    })
    .eq("id", true);
  if (error) return { message: "Setările nu au putut fi salvate." };
  revalidatePath("/", "layout");
  return { message: "Setările au fost salvate. Se aplică la următoarea comandă plătită." };
}

const pointsSchema = z.object({
  email: z.email({ error: "Introdu un email valid." }).trim().toLowerCase(),
  delta: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((v) => v !== 0, { error: "Introdu un număr diferit de 0." }),
  note: z.string().trim().min(3, { error: "Introdu motivul." }).max(200),
});

export async function adjustPoints(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = pointsSchema.safeParse({ email: formData.get("email"), delta: formData.get("delta"), note: formData.get("note") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const admin = createAdminClient();
  const { data: user } = await admin.from("profiles").select("id").eq("email", parsed.data.email).maybeSingle();
  if (!user) return { errors: { email: ["Nu există un cont cu acest email."] } };
  const { data, error } = await admin.rpc("admin_adjust_points", { p_user: user.id, p_delta: parsed.data.delta, p_note: parsed.data.note });
  if (error) return { message: "Ajustarea nu a putut fi făcută." };
  revalidatePath("/admin/gold");
  return { message: `Sold actual: ${data} puncte.` };
}

const lessonSchema = z.object({
  title: z.string().trim().min(2, { error: "Introdu titlul lecției." }).max(200),
  description: z.string().trim().max(2000).optional(),
  video_url: z.string().trim().url({ error: "Link invalid." }).startsWith("https://", { error: "Linkul trebuie să înceapă cu https://" }).optional(),
  duration_min: z.coerce.number().int().min(0).max(1000).optional(),
  chapter: z.string().trim().max(120).optional(),
});

export async function addLesson(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    description: opt(formData.get("description")),
    video_url: opt(formData.get("video_url")),
    duration_min: opt(formData.get("duration_min")),
    chapter: opt(formData.get("chapter")),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { data: last } = await supabase.from("course_lessons").select("position").eq("course_id", courseId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("course_lessons").insert({
    course_id: courseId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    video_url: parsed.data.video_url ?? null,
    duration_min: parsed.data.duration_min ?? null,
    chapter: parsed.data.chapter ?? null,
    position: (last?.position ?? 0) + 1,
  });
  if (error) return { message: "Lecția nu a putut fi salvată." };
  revalidatePath(`/admin/cursuri/${courseId}`);
  return { message: "Lecție adăugată." };
}

export async function deleteLesson(id: string, courseId: string) {
  const supabase = await requireAdmin();
  await supabase.from("course_lessons").delete().eq("id", id);
  revalidatePath(`/admin/cursuri/${courseId}`);
}

const codeSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, { error: "Cod de 3 până la 30 caractere (litere, cifre, - sau _)." }),
  kind: z.enum(["percent", "amount"]),
  value: z.coerce.number().positive({ error: "Introdu valoarea." }),
  course_id: z.string().uuid().optional(),
  max_uses: z.coerce.number().int().positive().optional(),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().trim().max(200).optional(),
});

export async function createDiscountCode(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const parsed = codeSchema.safeParse({
    code: formData.get("code"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    course_id: opt(formData.get("course_id")),
    max_uses: opt(formData.get("max_uses")),
    expires_on: opt(formData.get("expires_on")),
    note: opt(formData.get("note")),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  if (d.kind === "percent" && d.value > 100) return { errors: { value: ["Maximum 100%."] } };
  const { error } = await supabase.from("discount_codes").insert({
    code: d.code,
    kind: d.kind,
    value: d.kind === "percent" ? Math.round(d.value) : Math.round(d.value * 100),
    course_id: d.course_id ?? null,
    max_uses: d.max_uses ?? null,
    expires_at: d.expires_on ? bucharestIso(d.expires_on, 23) : null,
    note: d.note ?? null,
  });
  if (error) return { message: error.code === "23505" ? "Acest cod există deja." : "Codul nu a putut fi salvat." };
  revalidatePath("/admin/coduri");
  return { message: "Codul a fost creat." };
}

export async function toggleDiscountCode(id: string, active: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("discount_codes").update({ active }).eq("id", id);
  revalidatePath("/admin/coduri");
}
