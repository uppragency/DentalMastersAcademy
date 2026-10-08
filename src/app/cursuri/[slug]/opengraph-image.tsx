import { createPublicClient } from "@/lib/supabase/public";
import { ogImage, ogSize } from "@/lib/og";
import { formatDateRange, formatLabels, formatPrice } from "@/lib/format";

export const alt = "Curs Dental Masters Academy";
export const size = ogSize;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: c } = await createPublicClient()
    .from("courses")
    .select("title, summary, starts_at, ends_at, format, price_cents, currency")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!c) return ogImage({ eyebrow: "Curs", title: "Dental Masters Academy" });
  const fmt = formatLabels[c.format as keyof typeof formatLabels] ?? "";
  return ogImage({
    eyebrow: `${fmt} · ${formatDateRange(c.starts_at, c.ends_at)}`,
    title: c.title,
    subtitle: c.summary ?? undefined,
    footer: formatPrice(c.price_cents, c.currency || "EUR"),
  });
}
