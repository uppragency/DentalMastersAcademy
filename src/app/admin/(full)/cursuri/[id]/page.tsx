import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteLesson } from "@/actions/admin";
import { Button } from "@/components/ui";
import { CourseForm, DeleteCourseButton, LessonForm } from "@/components/admin-forms";
import { AnnounceForm, MaterialForm } from "@/components/engagement-forms";
import { deleteMaterial } from "@/actions/engagement";
import { ButtonLink } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getLessons } from "@/lib/data";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Editare curs | Administrare", robots: { index: false } };

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, categories, lessons, { data: others }, { data: materials }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle<Course>(),
    getCategories(),
    getLessons(id),
    supabase.from("courses").select("id, title").order("starts_at", { ascending: false }),
    supabase.from("course_materials").select("id, title, url").eq("course_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Editare curs</h1>
        <ButtonLink href={`/admin/cursuri/${id}/participanti`} variant="ghost">Participanți și prezență</ButtonLink>
      </div>
      <CourseForm course={data} categories={categories} otherCourses={others ?? []} />
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
      <section className="mt-14 border-t border-line pt-10" aria-labelledby="materials">
        <h2 id="materials" className="text-2xl font-semibold tracking-tight">Materiale pentru cursanți</h2>
        {(materials ?? []).length > 0 ? (
          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
            {materials!.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate underline underline-offset-4">{m.title}</a>
                <form action={deleteMaterial.bind(null, m.id, id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">Șterge</Button></form>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8"><MaterialForm courseId={id} slug={data.slug} /></div>
      </section>
      <section className="mt-14 border-t border-line pt-10" aria-labelledby="announce">
        <h2 id="announce" className="text-2xl font-semibold tracking-tight">Anunț către toți cursanții înscriși</h2>
        <p className="mt-2 text-sm text-muted">Apare în clopoțelul din cont și, opțional, ajunge pe email.</p>
        <div className="mt-6"><AnnounceForm courseId={id} slug={data.slug} /></div>
      </section>
      <div className="mt-10 border-t border-line pt-6"><DeleteCourseButton id={data.id} /></div>
    </div>
  );
}
