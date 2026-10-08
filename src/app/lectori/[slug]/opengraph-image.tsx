import { createPublicClient } from "@/lib/supabase/public";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "Lector Dental Masters Academy";
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: t } = await createPublicClient().from("trainers").select("name, role").eq("slug", slug).eq("published", true).maybeSingle();
  if (!t) return ogImage({ eyebrow: "Lector", title: "Dental Masters Academy" });
  return ogImage({ eyebrow: "Lector", title: t.name, subtitle: t.role ?? undefined });
}
