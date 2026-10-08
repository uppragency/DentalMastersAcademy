import type { Metadata } from "next";
import { CourseForm } from "@/components/admin-forms";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Curs nou | Administrare", robots: { index: false } };

export default async function NewCourse() {
  const categories = await getCategories();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Curs nou</h1>
      <CourseForm categories={categories} />
    </div>
  );
}
