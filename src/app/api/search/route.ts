import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (raw.length < 2) return NextResponse.json({ hits: [] });
  // PostgREST filter syntax uses , ( ) and wildcards: strip them from user input.
  const term = raw.replace(/[%_,()*\\]/g, " ").trim();
  if (term.length < 2) return NextResponse.json({ hits: [] });
  const like = `%${term}%`;
  const supabase = await createClient();
  const [courses, trainers, posts] = await Promise.all([
    supabase.from("courses").select("title, slug, summary").eq("status", "published").or(`title.ilike.${like},summary.ilike.${like},description.ilike.${like}`).limit(6),
    supabase.from("trainers").select("name, slug, role").eq("published", true).or(`name.ilike.${like},role.ilike.${like}`).limit(4),
    supabase.from("blog_posts").select("title, slug, excerpt").eq("published", true).or(`title.ilike.${like},excerpt.ilike.${like},body.ilike.${like}`).limit(4),
  ]);
  const hits = [
    ...(courses.data ?? []).map((c) => ({ type: "curs", title: c.title, href: `/cursuri/${c.slug}`, sub: c.summary ?? undefined })),
    ...(trainers.data ?? []).map((t) => ({ type: "lector", title: t.name, href: `/lectori/${t.slug}`, sub: t.role ?? undefined })),
    ...(posts.data ?? []).map((p) => ({ type: "articol", title: p.title, href: `/blog/${p.slug}`, sub: p.excerpt ?? undefined })),
  ];
  return NextResponse.json({ hits });
}
