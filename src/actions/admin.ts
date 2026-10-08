"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { FormState } from "@/actions/auth";

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

const courseSchema = z.object({
  title: z.string().trim().min(3, { error: "Titlul este obligatoriu." }).max(200),
  slug: z.string().trim().max(80).optional(),
  category_id: z.string().uuid().optional(),
  summary: z.string().trim().max(500).optional(),
  description: z.string().trim().max(20000).optional(),
  syllabus: z.string().trim().max(20000).optional(),
  trainer_name: z.string().trim().max(160).optional(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: z.enum(["physical", "online", "hybrid"]),
  location: z.string().trim().max(200).optional(),
  price_ron: z.coerce.number({ error: "Preț invalid." }).min(0).max(1_000_000),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

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
    format: formData.get("format"),
    location: opt(formData.get("location")),
    price_ron: formData.get("price_ron"),
    capacity: opt(formData.get("capacity")),
    status: formData.get("status"),
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
    starts_at: d.starts_on ? `${d.starts_on}T09:00:00+03:00` : null,
    format: d.format,
    location: d.location ?? null,
    price_cents: Math.round(d.price_ron * 100),
    currency: "RON",
    capacity: d.capacity ?? null,
    status: d.status,
    is_featured: formData.get("is_featured") === "on",
    gold_free: formData.get("gold_free") === "on",
  };

  const { error } = id
    ? await supabase.from("courses").update(row).eq("id", id)
    : await supabase.from("courses").insert(row);
  if (error) {
    return { message: error.code === "23505" ? "Există deja un curs cu acest slug." : "Cursul nu a putut fi salvat." };
  }
  revalidatePath("/", "layout");
  redirect("/admin/cursuri");
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

const loyaltySchema = z.object({
  spend_ron: z.coerce.number().min(0).optional(),
  courses_threshold: z.coerce.number().int().min(0).optional(),
  window_days: z.coerce.number().int().min(0).optional(),
  gold_discount_percent: z.coerce.number().min(0).max(100),
});

export async function saveLoyalty(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const parsed = loyaltySchema.safeParse({
    spend_ron: opt(formData.get("spend_ron")),
    courses_threshold: opt(formData.get("courses_threshold")),
    window_days: opt(formData.get("window_days")),
    gold_discount_percent: formData.get("gold_discount_percent"),
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
    })
    .eq("id", true);
  if (error) return { message: "Setările nu au putut fi salvate." };
  revalidatePath("/", "layout");
  return { message: "Setările Gold au fost salvate. Se aplică la următoarea comandă plătită." };
}
