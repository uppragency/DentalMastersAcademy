import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ThankYouView, thanksCourseSelect, type ThanksCourse } from "@/components/thank-you";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Mulțumim pentru înscriere", robots: { index: false } };

export default async function FreeThankYou({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/autentificare?next=/multumim/gratuit/${slug}`);
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select(`courses!inner(${thanksCourseSelect})`).eq("user_id", profile.id).eq("courses.slug", slug).maybeSingle();
  const course = (data as unknown as { courses: ThanksCourse } | null)?.courses;
  if (!course) notFound();
  return <ThankYouView profile={profile} course={course} order={null} status="free" />;
}
