import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ThankYouView, thanksCourseSelect, type ThanksCourse } from "@/components/thank-you";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Mulțumim pentru comandă", robots: { index: false } };

export default async function ThankYou({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/autentificare?next=/multumim/${id}`);
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(`id, status, total_cents, currency, order_items(courses(${thanksCourseSelect}))`)
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  const o = data as unknown as { id: string; status: string; total_cents: number; currency: string; order_items: { courses: ThanksCourse | null }[] } | null;
  if (!o) notFound();
  return <ThankYouView profile={profile} course={o.order_items[0]?.courses} order={o} status={o.status === "paid" ? "paid" : o.status === "pending" ? "pending" : "other"} />;
}
