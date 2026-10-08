import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { formatDate, formatLabels } from "@/lib/format";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Cursul meu", robots: { index: false } };

export default async function MyCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/autentificare?next=/cont/cursuri/${slug}`);

  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle<Course>();
  if (!course) notFound();

  // RLS: a student only sees their own enrollments
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enrollment) redirect(`/cursuri/${slug}`);

  return (
    <div className="max-w-3xl">
      <Link href="/cont/cursuri" className="text-sm text-muted hover:text-foreground">← Cursurile mele</Link>
      <div className="mt-6"><Eyebrow>Curs achiziționat</Eyebrow></div>
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight">{course.title}</h1>
      <dl className="mt-8 grid gap-4 rounded-3xl border border-line bg-card p-7 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Data</dt><dd className="mt-1 font-medium">{formatDate(course.starts_at)}</dd></div>
        <div><dt className="text-muted">Format</dt><dd className="mt-1 font-medium">{formatLabels[course.format]}</dd></div>
        {course.location ? <div><dt className="text-muted">Locație</dt><dd className="mt-1 font-medium">{course.location}</dd></div> : null}
        {course.trainer_name ? <div><dt className="text-muted">Formator</dt><dd className="mt-1 font-medium">{course.trainer_name}</dd></div> : null}
      </dl>
      {course.syllabus ? (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Programa</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{course.syllabus}</p>
        </section>
      ) : null}
    </div>
  );
}
