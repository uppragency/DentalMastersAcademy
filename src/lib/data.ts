import { createClient } from "@/lib/supabase/server";
import type { Category, Course, Lesson, LoyaltySettings, Notification, Profile, Testimonial } from "@/lib/types";

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

export type GoldProgress = {
  active: boolean;
  spentCents: number;
  courses: number;
  savedCents: number;
  spendThresholdCents: number | null;
  coursesThreshold: number | null;
  windowDays: number | null;
  percent: number;
  remainingCents: number | null;
  remainingCourses: number | null;
};

export async function getGoldProgress(userId: string, settings: LoyaltySettings | null): Promise<GoldProgress> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("total_cents, discount_cents, paid_at, order_items(course_id)")
    .eq("user_id", userId)
    .eq("status", "paid");

  const since = settings?.window_days ? Date.now() - settings.window_days * 86_400_000 : null;
  const rows = (data ?? []).filter((o) => !since || (o.paid_at && new Date(o.paid_at).getTime() >= since));
  const spent = rows.reduce((sum, o) => sum + o.total_cents, 0);
  const saved = (data ?? []).reduce((sum, o) => sum + o.discount_cents, 0);
  const courseIds = new Set(rows.flatMap((o) => (o.order_items as { course_id: string }[]).map((i) => i.course_id)));

  const spendT = settings?.spend_threshold_cents ?? null;
  const coursesT = settings?.courses_threshold ?? null;
  const ratios = [spendT ? spent / spendT : null, coursesT ? courseIds.size / coursesT : null].filter(
    (r): r is number => r !== null,
  );

  return {
    active: Boolean(settings?.is_active && (spendT || coursesT)),
    spentCents: spent,
    courses: courseIds.size,
    savedCents: saved,
    spendThresholdCents: spendT,
    coursesThreshold: coursesT,
    windowDays: settings?.window_days ?? null,
    percent: ratios.length ? Math.min(100, Math.round(Math.max(...ratios) * 100)) : 0,
    remainingCents: spendT ? Math.max(0, spendT - spent) : null,
    remainingCourses: coursesT ? Math.max(0, coursesT - courseIds.size) : null,
  };
}

export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getLessons(courseId: string): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("course_lessons").select("*").eq("course_id", courseId).order("position");
  return (data ?? []) as Lesson[];
}

export async function getCompletedLessonIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  return (data ?? []).map((r: { lesson_id: string }) => r.lesson_id);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("category_id").eq("status", "published");
  const counts: Record<string, number> = {};
  for (const r of data ?? []) if (r.category_id) counts[r.category_id] = (counts[r.category_id] ?? 0) + 1;
  return counts;
}
