import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro";
  const supabase = await createClient();
  const [courses, posts, trainers] = await Promise.all([
    supabase.from("courses").select("slug, updated_at").eq("status", "published"),
    supabase.from("blog_posts").select("slug, published_at").eq("published", true),
    supabase.from("trainers").select("slug").eq("published", true),
  ]);
  const fixed = ["", "/cursuri", "/categorii", "/despre", "/lectori", "/blog", "/evenimente", "/testimoniale", "/contact", "/rambursare"].map((p) => ({ url: `${base}${p}` }));
  return [
    ...fixed,
    ...(courses.data ?? []).map((c) => ({ url: `${base}/cursuri/${c.slug}`, lastModified: c.updated_at })),
    ...(posts.data ?? []).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.published_at ?? undefined })),
    ...(trainers.data ?? []).map((t) => ({ url: `${base}/lectori/${t.slug}` })),
  ];
}
