import { createClient } from "@/lib/supabase/server";
import type { Category, Course, LoyaltySettings, Profile, Testimonial } from "@/lib/types";

const courseSelect = "*, categories(name, slug)";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return (data ?? []) as Category[];
}

export async function getCourses(opts: { category?: string; format?: string; featured?: boolean; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase.from("courses").select(courseSelect).eq("status", "published");

  if (opts.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).maybeSingle();
    if (!cat) return [] as Course[];
    query = query.eq("category_id", cat.id);
  }
  if (opts.format && ["physical", "online", "hybrid"].includes(opts.format)) query = query.eq("format", opts.format);
  if (opts.featured) query = query.eq("is_featured", true);

  query = query.order("starts_at", { ascending: true, nullsFirst: false });
  if (opts.limit) query = query.limit(opts.limit);

  const { data } = await query;
  return (data ?? []) as Course[];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(courseSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as Course | null) ?? null;
}

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const supabase = await createClient();
  let query = supabase.from("testimonials").select("*").eq("is_published", true).order("sort_order");
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []) as Testimonial[];
}

export async function getLoyaltySettings(): Promise<LoyaltySettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("loyalty_settings").select("*").maybeSingle();
  return (data as LoyaltySettings | null) ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function getEnrolledCourseIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select("course_id").eq("user_id", userId);
  return (data ?? []).map((r: { course_id: string }) => r.course_id);
}

export type EnrollmentRow = {
  id: string;
  created_at: string;
  source: "purchase" | "gold_free" | "admin";
  courses: Course | null;
};

export async function getMyEnrollments(userId: string): Promise<EnrollmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, created_at, source, courses(*, categories(name, slug))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as EnrollmentRow[];
}

export type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  order_items: { courses: { title: string; slug: string } | null }[];
};

export async function getMyOrders(userId: string): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at, order_items(courses(title, slug))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as OrderRow[];
}
