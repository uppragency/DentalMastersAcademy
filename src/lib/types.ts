export type Tier = "standard" | "gold";
export type CourseFormat = "physical" | "online" | "hybrid";

export type Category = { id: string; slug: string; name: string; sort_order: number };

export type Course = {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  syllabus: string | null;
  trainer_name: string | null;
  starts_at: string | null;
  format: CourseFormat;
  location: string | null;
  price_cents: number;
  currency: string;
  capacity: number | null;
  cover_url: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  gold_free: boolean;
  categories?: { name: string; slug: string } | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  specialization: string | null;
  role: "student" | "admin";
  tier: Tier;
};

export type LoyaltySettings = {
  is_active: boolean;
  spend_threshold_cents: number | null;
  courses_threshold: number | null;
  window_days: number | null;
  gold_discount_percent: number;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_title: string | null;
  quote: string;
  photo_url: string | null;
};
