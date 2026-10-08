import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeEditForm } from "@/components/staff-forms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editare cod | Administrare", robots: { index: false } };

export default async function EditCode({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: code }, { data: courses }] = await Promise.all([
    supabase.from("discount_codes").select("id, code, kind, value, course_id, max_uses, used_count, starts_at, expires_at, note").eq("id", id).maybeSingle(),
    supabase.from("courses").select("id, title").order("title"),
  ]);
  if (!code) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/coduri" className="text-sm text-muted hover:text-foreground">← Coduri reducere</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cod <span className="font-mono">{code.code}</span></h1>
      <p className="mt-2 text-sm text-muted">Folosit de {code.used_count} ori. Modificările nu afectează comenzile deja plătite.</p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-7"><CodeEditForm code={code} courses={courses ?? []} /></div>
    </div>
  );
}
