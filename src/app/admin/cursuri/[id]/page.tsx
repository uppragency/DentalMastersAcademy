import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteLesson } from "@/actions/admin";
import { Button } from "@/components/ui";
import { CourseForm, DeleteCourseButton, LessonForm } from "@/components/admin-forms";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getLessons } from "@/lib/data";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Editare curs | Administrare", robots: { index: false } };

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, categories, lessons] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle<Course>(),
    getCategories(),
    getLessons(id),
  ]);
  if (!data) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Editare curs</h1>
      <CourseForm course={data} categories={categories} />
      <section className="mt-14 border-t border-line pt-10" aria-labelledby="lessons">
        <h2 id="lessons" className="text-2xl font-semibold tracking-tight">Lecții și materiale video</h2>
        <p className="mt-2 text-sm text-muted">Lecțiile sunt vizibile doar cursanților înscriși.</p>
        {lessons.length > 0 ? (
          <ol className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
            {lessons.map((l, i) => (
              <li key={l.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <span className="min-w-0"><span className="mr-3 text-muted">{i + 1}.</span>{l.title}{l.video_url ? "" : " (fără video)"}</span>
                <form action={deleteLesson.bind(null, l.id, id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">Șterge</Button></form>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="mt-8"><LessonForm courseId={id} /></div>
      </section>
      <div className="mt-10 border-t border-line pt-6"><DeleteCourseButton id={data.id} /></div>
    </div>
  );
}
