"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data";
import { requireAdminClient } from "@/lib/require-admin";
import { sendMail } from "@/lib/email";
import { courseDays, isEnded } from "@/lib/format";
import type { FormState } from "@/actions/auth";

/** Notify every enrolled participant: in-account notification, optionally also email. */
async function notifyEnrolled(courseId: string, opts: { title: string; body: string; href: string; email: boolean; subject?: string }) {
  const admin = createAdminClient();
  const { data: rows } = await admin.from("enrollments").select("user_id, profiles(email, full_name)").eq("course_id", courseId);
  const list = (rows ?? []) as unknown as { user_id: string; profiles: { email: string; full_name: string | null } | null }[];
  if (list.length === 0) return 0;
  await admin.from("notifications").insert(list.map((r) => ({ user_id: r.user_id, kind: "material", title: opts.title, body: opts.body, href: opts.href })));
  if (opts.email) {
    for (const r of list) {
      if (!r.profiles?.email) continue;
      await sendMail({
        to: r.profiles.email,
        subject: opts.subject ?? opts.title,
        heading: opts.title,
        paragraphs: [`${r.profiles.full_name ? `Bună, ${r.profiles.full_name}.` : "Bună."} ${opts.body}`],
        cta: { label: "Deschide în cont", href: opts.href },
        kind: "announcement",
      });
    }
  }
  return list.length;
}

const announceSchema = z.object({
  title: z.string().trim().min(3, { error: "Introdu titlul." }).max(160),
  body: z.string().trim().min(3, { error: "Introdu mesajul." }).max(1000),
});

export async function announceToEnrolled(courseId: string, slug: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdminClient();
  const parsed = announceSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const n = await notifyEnrolled(courseId, { ...parsed.data, href: `/cont/cursuri/${slug}`, email: formData.get("email") === "on" });
  return { message: n ? `Anunț trimis către ${n} cursanți.` : "Nu există cursanți înscriși." };
}

const materialSchema = z.object({
  title: z.string().trim().min(2, { error: "Introdu titlul." }).max(200),
  description: z.string().trim().max(500).optional(),
  url: z.string().trim().url({ error: "Link invalid." }).startsWith("https://", { error: "Linkul trebuie să înceapă cu https://" }),
});

export async function addMaterial(courseId: string, slug: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdminClient();
  const parsed = materialSchema.safeParse({ title: formData.get("title"), description: formData.get("description") || undefined, url: formData.get("url") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const { error } = await supabase.from("course_materials").insert({ course_id: courseId, ...parsed.data });
  if (error) return { message: "Materialul nu a putut fi salvat." };
  let msg = "Material adăugat.";
  if (formData.get("notify") === "on") {
    const n = await notifyEnrolled(courseId, { title: `Material nou: ${parsed.data.title}`, body: "A fost adăugat un material nou la cursul tău.", href: `/cont/cursuri/${slug}`, email: formData.get("email") === "on" });
    msg += ` Cursanți notificați: ${n}.`;
  }
  revalidatePath(`/cont/cursuri/${slug}`);
  return { message: msg };
}

export async function deleteMaterial(id: string, courseId: string) {
  const { supabase } = await requireAdminClient();
  await supabase.from("course_materials").delete().eq("id", id);
  revalidatePath(`/admin/cursuri/${courseId}`);
}

/* Attendance and confirmation letters */
export async function setAttendance(enrollmentId: string, courseId: string, attended: boolean) {
  await requireAdminClient();
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("starts_at, ends_at").eq("id", courseId).maybeSingle();
  const days = course ? courseDays(course.starts_at, course.ends_at) : [];
  if (days.length) await admin.from("attendance").upsert(days.map((day) => ({ enrollment_id: enrollmentId, day, present: attended })));
  await admin.from("enrollments").update({ attended }).eq("id", enrollmentId);
  if (attended) await admin.rpc("issue_certificate", { p_enrollment: enrollmentId });
  revalidatePath(`/admin/cursuri/${courseId}/participanti`);
}

export async function sendConfirmationLetters(courseId: string): Promise<void> {
  await requireAdminClient();
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("title, slug").eq("id", courseId).single();
  const { data: rows } = await admin.from("enrollments").select("user_id, profiles(email, full_name)").eq("course_id", courseId).eq("attended", true);
  const list = (rows ?? []) as unknown as { user_id: string; profiles: { email: string; full_name: string | null } | null }[];
  if (!course) return;
  for (const r of list) {
    await admin.from("notifications").insert({ user_id: r.user_id, kind: "info", title: "Adeverința de participare este disponibilă", body: course.title, href: `/cont/cursuri/${course.slug}/adeverinta` });
    if (r.profiles?.email) {
      await sendMail({
        to: r.profiles.email,
        subject: `Adeverință de participare: ${course.title}`,
        heading: "Adeverința ta de participare",
        paragraphs: [`Mulțumim că ai participat la ${course.title}. Adeverința poate fi deschisă și printată din contul tău.`],
        cta: { label: "Deschide adeverința", href: `/cont/cursuri/${course.slug}/adeverinta` },
        kind: "certificate",
        userId: r.user_id,
      });
    }
  }
  revalidatePath(`/admin/cursuri/${courseId}/participanti`);
}

/* Verified review */
const reviewSchema = z.object({ quote: z.string().trim().min(20, { error: "Scrie cel puțin 20 de caractere." }).max(1200) });

export async function submitReview(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Autentifică-te pentru a trimite o recenzie." };
  const parsed = reviewSchema.safeParse({ quote: formData.get("quote") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: enr } = await supabase.from("enrollments").select("id, courses(starts_at, ends_at, title)").eq("user_id", profile.id).eq("course_id", courseId).maybeSingle();
  const course = (enr as unknown as { courses: { starts_at: string | null; ends_at: string | null; title: string } | null } | null)?.courses;
  if (!enr || !course) return { message: "Poți recenza doar cursurile la care ești înscris." };
  if (!isEnded(course, Date.now())) return { message: "Recenzia se poate trimite după încheierea cursului." };

  const admin = createAdminClient();
  const { count } = await admin.from("testimonials").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("course_id", courseId);
  if ((count ?? 0) > 0) return { message: "Ai trimis deja o recenzie pentru acest curs." };
  const { error } = await admin.from("testimonials").insert({
    author_name: profile.full_name ?? "Cursant",
    author_title: [profile.specialization, course.title].filter(Boolean).join(", "),
    quote: parsed.data.quote,
    is_published: false,
    verified: true,
    user_id: profile.id,
    course_id: courseId,
    sort_order: 100,
  });
  if (error) return { message: "Recenzia nu a putut fi trimisă." };
  return { message: "Mulțumim! Recenzia va apărea pe site după aprobarea echipei." };
}
