"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAdminClient } from "@/lib/require-admin";
import { uploadImage } from "@/lib/media";
import { bucharestInstant } from "@/lib/format";
import type { FormState } from "@/actions/auth";

const slugify = (input: string) =>
  input.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
const lines = (v: string | undefined) => (v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
const fileOf = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);

/* Trainers */
const trainerSchema = z.object({
  name: z.string().trim().min(3, { error: "Introdu numele." }).max(120),
  role: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(4000).optional(),
  points: z.string().max(3000).optional(),
  intro_video_url: z.string().trim().url().startsWith("https://", { error: "Linkul trebuie să înceapă cu https://" }).optional(),
});

export async function saveTrainer(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdminClient();
  const parsed = trainerSchema.safeParse({ name: opt(formData.get("name")), role: opt(formData.get("role")), bio: opt(formData.get("bio")), points: opt(formData.get("points")), intro_video_url: opt(formData.get("intro_video_url")) });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const row: Record<string, unknown> = { name: d.name, role: d.role ?? null, bio: d.bio ?? null, points: lines(d.points), intro_video_url: d.intro_video_url ?? null, published: formData.get("published") === "on" };
  const photo = fileOf(formData.get("photo"));
  if (photo) {
    const up = await uploadImage(photo, "trainers");
    if ("error" in up) return { message: up.error };
    row.photo_url = up.url;
  }
  const { error } = await supabase.from("trainers").update(row).eq("id", id);
  if (error) return { message: "Profilul nu a putut fi salvat." };
  revalidatePath("/", "layout");
  return { message: "Profil salvat." };
}

/* Blog */
const postSchema = z.object({
  title: z.string().trim().min(5, { error: "Titlul este prea scurt." }).max(200),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().max(400).optional(),
  body: z.string().trim().min(30, { error: "Textul este prea scurt." }).max(40000),
  author_name: z.string().trim().max(120).optional(),
});

export async function savePost(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdminClient();
  const parsed = postSchema.safeParse({ title: opt(formData.get("title")), slug: opt(formData.get("slug")), excerpt: opt(formData.get("excerpt")), body: opt(formData.get("body")), author_name: opt(formData.get("author_name")) });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const published = formData.get("published") === "on";
  const row: Record<string, unknown> = {
    title: d.title,
    slug: slugify(d.slug || d.title),
    excerpt: d.excerpt ?? null,
    body: d.body,
    author_name: d.author_name ?? "Echipa Dental Masters Academy",
    trainer_id: opt(formData.get("trainer_id")) ?? null,
    published,
  };
  if (published) {
    const scheduled = bucharestInstant(opt(formData.get("publish_at")));
    if (scheduled) row.published_at = scheduled;
    else {
      const { data: prev } = id ? await supabase.from("blog_posts").select("published, published_at").eq("id", id).maybeSingle() : { data: null };
      row.published_at = prev?.published && prev.published_at ? prev.published_at : new Date().toISOString();
    }
  }
  const cover = fileOf(formData.get("cover"));
  if (cover) {
    const up = await uploadImage(cover, "blog");
    if ("error" in up) return { message: up.error };
    row.cover_url = up.url;
  }
  const { error } = id ? await supabase.from("blog_posts").update(row).eq("id", id) : await supabase.from("blog_posts").insert(row);
  if (error) return { message: error.code === "23505" ? "Există deja un articol cu acest slug." : "Articolul nu a putut fi salvat." };
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/blog");
  redirect("/admin/blog");
}

/* Events */
const eventSchema = z.object({
  title: z.string().trim().min(3, { error: "Introdu titlul." }).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Alege data." }),
  location: z.string().trim().max(200).optional(),
  participants: z.coerce.number().int().min(0).max(10000).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function addEvent(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdminClient();
  const parsed = eventSchema.safeParse({ title: opt(formData.get("title")), event_date: opt(formData.get("event_date")), location: opt(formData.get("location")), participants: opt(formData.get("participants")), description: opt(formData.get("description")) });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  const photos: string[] = [];
  for (const f of formData.getAll("photos")) {
    const file = fileOf(f);
    if (!file) continue;
    const up = await uploadImage(file, "events");
    if ("error" in up) return { message: up.error };
    photos.push(up.url);
  }
  const { error } = await supabase.from("events").insert({ title: d.title, event_date: d.event_date, location: d.location ?? null, participants: d.participants ?? null, description: d.description ?? null, photos });
  if (error) return { message: "Evenimentul nu a putut fi salvat." };
  revalidatePath("/evenimente");
  return { message: "Eveniment adăugat." };
}

export async function deleteEvent(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/evenimente");
  revalidatePath("/admin/evenimente");
}
