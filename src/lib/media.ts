import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Uploads an image to the public "media" bucket. Caller must have verified admin. Returns the public URL or an error text. */
export async function uploadImage(file: File, folder: string): Promise<{ url: string } | { error: string }> {
  const ext = allowed[file.type];
  if (!ext) return { error: "Format imagine neacceptat (JPG, PNG, WebP sau AVIF)." };
  if (file.size > 6 * 1024 * 1024) return { error: "Imaginea depășește 6 MB." };
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("media").upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000" });
  if (error) return { error: "Încărcarea a eșuat." };
  return { url: admin.storage.from("media").getPublicUrl(path).data.publicUrl };
}
