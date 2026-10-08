import type { Metadata } from "next";
import Link from "next/link";
import { duplicateCourse } from "@/actions/admin";
import { Button, ButtonLink } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "Cursuri | Administrare", robots: { index: false } };

const statusLabel = { draft: "Ciornă", published: "Publicat", archived: "Arhivat" } as const;

export default async function AdminCourses() {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
  const courses = (data ?? []) as Course[];
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Cursuri</h1>
        <ButtonLink href="/admin/cursuri/nou" variant="gold">Curs nou</ButtonLink>
      </div>
      {courses.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-3 font-medium">Titlu</th><th className="px-5 py-3 font-medium">Data</th><th className="px-5 py-3 font-medium">Preț</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4"><Link href={`/admin/cursuri/${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.title}</Link></td>
                  <td className="px-5 py-4">{formatDate(c.starts_at)}</td>
                  <td className="px-5 py-4">{formatPrice(c.price_cents, c.currency.trim())}</td>
                  <td className="px-5 py-4">{statusLabel[c.status]}</td>
                  <td className="px-5 py-4 text-right"><form action={duplicateCourse.bind(null, c.id)} className="flex items-center justify-end gap-2"><input type="date" name="starts_on" aria-label={`Data noii ediții pentru ${c.title}`} className="min-h-9 rounded-full border border-line bg-background px-3 text-xs" /><Button type="submit" variant="ghost" className="min-h-9 px-4">Clonează ca ediție nouă</Button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-12 text-center text-muted">Nu există cursuri. Adaugă primul curs.</p>
      )}
    </>
  );
}
