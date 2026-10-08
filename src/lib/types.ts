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
  language: string | null;
  ends_at: string | null;
  old_price_cents: number | null;
  audience: string[];
  outcomes: string[];
  sections: { title: string; items: string[] }[];
  registration_opens_at: string | null;
  next_edition_of: string | null;
  promo_video_url: string | null;
  faqs: { q: string; a: string }[];
  schedule: { title: string; items: { time: string; text: string }[] }[];
  parking_info: string | null;
  bring_info: string | null;
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
  referral_friend_percent: number;
  referral_reward_percent: number;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_title: string | null;
  quote: string;
  photo_url: string | null;
  verified?: boolean;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_min: number | null;
  position: number;
  chapter: string | null;
};

export type Trainer = {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  points: string[];
  photo_url: string | null;
  sort_order: number;
  published: boolean;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  author_name: string;
  trainer_id: string | null;
  cover_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  participants: number | null;
  description: string | null;
  photos: string[];
  published: boolean;
};
