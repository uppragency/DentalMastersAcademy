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
  // Every page exists in Romanian (no prefix) and English (/en), with hreflang alternates.
  const entry = (path: string, lastModified?: string) => {
    const ro = `${base}${path}`;
    const en = `${base}/en${path}`;
    const alternates = { languages: { ro, en, "x-default": ro } };
    return [
      { url: ro, lastModified, alternates },
      { url: en, lastModified, alternates },
    ];
  };
  const fixed = ["", "/cursuri", "/cine-suntem", "/lectori", "/parteneri", "/mentorat", "/blog", "/evenimente", "/testimoniale", "/contact", "/rambursare"].flatMap((p) => entry(p));
  return [
    ...fixed,
    ...(courses.data ?? []).flatMap((c) => entry(`/cursuri/${c.slug}`, c.updated_at)),
    ...(posts.data ?? []).flatMap((p) => entry(`/blog/${p.slug}`, p.published_at ?? undefined)),
    ...(trainers.data ?? []).flatMap((t) => entry(`/lectori/${t.slug}`)),
  ];
}
