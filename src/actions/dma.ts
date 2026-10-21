"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/require-admin";
import { uploadImage } from "@/lib/media";
import { parseVideo } from "@/lib/video";

const text = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const orNull = (v: string) => (v === "" ? null : v);
const imageFiles = (f: FormData, k: string) => f.getAll(k).filter((v): v is File => v instanceof File && v.size > 0);
const httpsOrNull = (v: string) => (/^https:\/\/\S+$/.test(v) ? v : null);

function refresh() {
  revalidatePath("/", "layout");
}

/* Parteneri */
export async function savePartner(formData: FormData) {
  const { supabase } = await requireAdminClient();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name.length < 2) return;
  const row: Record<string, unknown> = {
    name,
    description: orNull(text(formData, "description")),
    url: httpsOrNull(text(formData, "url")),
    sort_order: Number(text(formData, "sort_order")) || 0,
    published: formData.get("published") === "on",
  };
  const logo = imageFiles(formData, "logo")[0];
  if (logo) {
    const up = await uploadImage(logo, "partners");
    if ("url" in up) row.logo_url = up.url;
  }
  if (id) await supabase.from("partners").update(row).eq("id", id);
  else await supabase.from("partners").insert(row);
  refresh();
}

export async function deletePartner(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("partners").delete().eq("id", id);
  refresh();
}

/* Cazuri clinice ale lectorilor */
export async function saveClinicalCase(formData: FormData) {
  const { supabase } = await requireAdminClient();
  const id = text(formData, "id");
  const trainerId = text(formData, "trainer_id");
  const title = text(formData, "title");
  if (!trainerId || title.length < 3) return;
  const uploaded: string[] = [];
  for (const file of imageFiles(formData, "images").slice(0, 8)) {
    const up = await uploadImage(file, "cases");
    if ("url" in up) uploaded.push(up.url);
  }
  const row: Record<string, unknown> = {
    trainer_id: trainerId,
    title,
    description: orNull(text(formData, "description")),
    sort_order: Number(text(formData, "sort_order")) || 0,
    published: formData.get("published") === "on",
  };
  if (id) {
    const { data } = await supabase.from("clinical_cases").select("image_urls").eq("id", id).maybeSingle();
    const keep = formData.get("clear_images") === "on" ? [] : (data?.image_urls ?? []);
    await supabase.from("clinical_cases").update({ ...row, image_urls: [...keep, ...uploaded].slice(0, 12) }).eq("id", id);
  } else {
    await supabase.from("clinical_cases").insert({ ...row, image_urls: uploaded });
  }
  refresh();
}

export async function deleteClinicalCase(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("clinical_cases").delete().eq("id", id);
  refresh();
}

/* Galerii foto */
export async function createAlbum(formData: FormData) {
  const { supabase } = await requireAdminClient();
  const title = text(formData, "title");
  if (title.length < 3) return;
  await supabase.from("gallery_albums").insert({
    title,
    edition_label: orNull(text(formData, "edition_label")),
    course_id: orNull(text(formData, "course_id")),
    published: true,
  });
  refresh();
}

export async function addAlbumPhotos(albumId: string, formData: FormData) {
  const { supabase } = await requireAdminClient();
  const rows: { album_id: string; url: string; sort_order: number }[] = [];
  let order = Date.now() % 1_000_000;
  for (const file of imageFiles(formData, "photos").slice(0, 30)) {
    const up = await uploadImage(file, "gallery", 8);
    if ("url" in up) rows.push({ album_id: albumId, url: up.url, sort_order: order++ });
  }
  if (rows.length) await supabase.from("gallery_photos").insert(rows);
  refresh();
}

export async function deletePhoto(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("gallery_photos").delete().eq("id", id);
  refresh();
}

export async function toggleAlbum(id: string, published: boolean) {
  const { supabase } = await requireAdminClient();
  await supabase.from("gallery_albums").update({ published }).eq("id", id);
  refresh();
}

export async function deleteAlbum(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("gallery_albums").delete().eq("id", id);
  refresh();
}

/* Testimoniale video */
export async function saveTestimonialVideo(formData: FormData) {
  const { supabase } = await requireAdminClient();
  const url = httpsOrNull(text(formData, "video_url"));
  const name = text(formData, "author_name");
  if (!url || !parseVideo(url) || name.length < 2) return;
  await supabase.from("testimonial_videos").insert({
    author_name: name,
    course_id: orNull(text(formData, "course_id")),
    title: orNull(text(formData, "title")),
    video_url: url,
    is_published: true,
  });
  refresh();
}

export async function toggleTestimonialVideo(id: string, published: boolean) {
  const { supabase } = await requireAdminClient();
  await supabase.from("testimonial_videos").update({ is_published: published }).eq("id", id);
  refresh();
}

export async function deleteTestimonialVideo(id: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("testimonial_videos").delete().eq("id", id);
  refresh();
}

/* Solicitări de caz */
export async function updateCaseRequest(id: string, formData: FormData) {
  const { supabase } = await requireAdminClient();
  const status = text(formData, "status");
  if (!["nou", "in_analiza", "preluat", "inchis"].includes(status)) return;
  await supabase.from("case_requests").update({ status, admin_note: orNull(text(formData, "admin_note")) }).eq("id", id);
  revalidatePath("/admin/solicitari");
}
