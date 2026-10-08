import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm, DeleteCourseButton } from "@/components/admin-forms";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Editare curs | Administrare", robots: { index: false } };

export default async function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, categories] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle<Course>(),
    getCategories(),
  ]);
  if (!data) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Editare curs</h1>
      <CourseForm course={data} categories={categories} />
      <div className="mt-10 border-t border-line pt-6"><DeleteCourseButton id={data.id} /></div>
    </div>
  );
}
