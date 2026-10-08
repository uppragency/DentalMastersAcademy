import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowMs } from "@/lib/time";

const ACCESS_MONTHS = 12;

/** Redirects an enrolled student to a short-lived signed link for a private material file. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Neautorizat", { status: 401 });
  // RLS: only enrolled students and admins can read the row.
  const { data: m } = await supabase.from("course_materials").select("file_path, title, courses(starts_at, ends_at)").eq("id", id).maybeSingle();
  const course = (m as unknown as { courses: { starts_at: string | null; ends_at: string | null } | null } | null)?.courses;
  if (!m?.file_path) return new Response("Material indisponibil", { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  const staff = profile?.role === "admin";
  const ref = course?.ends_at ?? course?.starts_at;
  if (!staff && ref) {
    const until = new Date(ref);
    until.setMonth(until.getMonth() + ACCESS_MONTHS);
    if (until.getTime() < nowMs()) return new Response("Accesul la materiale a expirat (12 luni după curs).", { status: 403 });
  }
  const { data } = await createAdminClient().storage.from("materials").createSignedUrl(m.file_path, 120, { download: m.file_path.split("/").pop() ?? true });
  if (!data?.signedUrl) return new Response("Fișierul nu a putut fi deschis", { status: 502 });
  return NextResponse.redirect(data.signedUrl);
}
