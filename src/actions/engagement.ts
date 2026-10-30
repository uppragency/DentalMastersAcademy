"use server";

import { getLocale, tr } from "@/lib/i18n/server";
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
        paragraphs: [tr("{v1} {body}", { v1: r.profiles.full_name ? tr("Bună, {full_name}.", { full_name: r.profiles.full_name }) : tr("Bună."), body: opts.body })],
        cta: { label: tr("Deschide în cont"), href: opts.href },
        kind: "announcement",
      });
    }
  }
  return list.length;
}

const announceSchema = z.object({
  title: z.string().trim().min(3, { error: () => tr("Introdu titlul.") }).max(160),
  body: z.string().trim().min(3, { error: () => tr("Introdu mesajul.") }).max(1000),
});

export async function announceToEnrolled(courseId: string, slug: string, _: FormState, formData: FormData): Promise<FormState> {
  await getLocale();
  await requireAdminClient();
  const parsed = announceSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const n = await notifyEnrolled(courseId, { ...parsed.data, href: `/cont/cursuri/${slug}`, email: formData.get("email") === "on" });
  return { message: n ? tr("Anunț trimis către {n} cursanți.", { n: n }) : tr("Nu există cursanți înscriși.") };
}

const materialSchema = z.object({
  title: z.string().trim().min(2, { error: () => tr("Introdu titlul.") }).max(200),
  description: z.string().trim().max(500).optional(),
  url: z.string().trim().url({ error: () => tr("Link invalid.") }).startsWith("https://", { error: () => tr("Linkul trebuie să înceapă cu https://") }).optional(),
});

export async function addMaterial(courseId: string, slug: string, _: FormState, formData: FormData): Promise<FormState> {
  await getLocale();
  const { supabase } = await requireAdminClient();
  const parsed = materialSchema.safeParse({ title: formData.get("title"), description: formData.get("description") || undefined, url: formData.get("url") || undefined });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const file = formData.get("file");
  let file_path: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) return { message: tr("Fișierul depășește 4 MB. Folosește un link pentru fișiere mari.") };
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    file_path = `${courseId}/${crypto.randomUUID()}.${ext}`;
    const up = await createAdminClient().storage.from("materials").upload(file_path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
    if (up.error) return { message: tr("Încărcarea fișierului a eșuat.") };
  }
  if (!file_path && !parsed.data.url) return { errors: { url: [tr("Adaugă un fișier sau un link.")] } };
  const { error } = await supabase.from("course_materials").insert({ course_id: courseId, ...parsed.data, url: parsed.data.url ?? null, file_path });
  if (error) return { message: tr("Materialul nu a putut fi salvat.") };
  let msg = tr("Material adăugat.");
  if (formData.get("notify") === "on") {
    const n = await notifyEnrolled(courseId, { title: `Material nou: ${parsed.data.title}`, body: tr("A fost adăugat un material nou la cursul tău."), href: `/cont/cursuri/${slug}`, email: formData.get("email") === "on" });
    msg += tr(" Cursanți notificați: {n}.", { n: n });
  }
  revalidatePath(`/cont/cursuri/${slug}`);
  return { message: msg };
}

export async function deleteMaterial(id: string, courseId: string) {
  await getLocale();
  const { supabase } = await requireAdminClient();
  await supabase.from("course_materials").delete().eq("id", id);
  revalidatePath(`/admin/cursuri/${courseId}`);
}

/* Attendance and confirmation letters */
export async function setAttendance(enrollmentId: string, courseId: string, attended: boolean) {
  await getLocale();
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
  await getLocale();
  await requireAdminClient();
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("title, slug").eq("id", courseId).single();
  const { data: rows } = await admin.from("enrollments").select("user_id, profiles(email, full_name)").eq("course_id", courseId).eq("attended", true);
  const list = (rows ?? []) as unknown as { user_id: string; profiles: { email: string; full_name: string | null } | null }[];
  if (!course) return;
  for (const r of list) {
    await admin.from("notifications").insert({ user_id: r.user_id, kind: "info", title: tr("Adeverința de participare este disponibilă"), body: course.title, href: `/cont/cursuri/${course.slug}/adeverinta` });
    if (r.profiles?.email) {
      await sendMail({
        to: r.profiles.email,
        subject: tr("Adeverință de participare: {title}", { title: course.title }),
        heading: tr("Adeverința ta de participare"),
        paragraphs: [tr("Mulțumim că ai participat la {title}. Adeverința poate fi deschisă și printată din contul tău.", { title: course.title })],
        cta: { label: tr("Deschide adeverința"), href: `/cont/cursuri/${course.slug}/adeverinta` },
        kind: "certificate",
        userId: r.user_id,
      });
    }
  }
  revalidatePath(`/admin/cursuri/${courseId}/participanti`);
}

/* Verified review */
const reviewSchema = z.object({ quote: z.string().trim().min(20, { error: () => tr("Scrie cel puțin 20 de caractere.") }).max(1200) });

export async function submitReview(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  await getLocale();
  const profile = await getCurrentProfile();
  if (!profile) return { message: tr("Autentifică-te pentru a trimite o recenzie.") };
  const parsed = reviewSchema.safeParse({ quote: formData.get("quote") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: enr } = await supabase.from("enrollments").select("id, courses(starts_at, ends_at, title)").eq("user_id", profile.id).eq("course_id", courseId).maybeSingle();
  const course = (enr as unknown as { courses: { starts_at: string | null; ends_at: string | null; title: string } | null } | null)?.courses;
  if (!enr || !course) return { message: tr("Poți recenza doar cursurile la care ești înscris.") };
  if (!isEnded(course, Date.now())) return { message: tr("Recenzia se poate trimite după încheierea cursului.") };

  const admin = createAdminClient();
  const { count } = await admin.from("testimonials").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("course_id", courseId);
  if ((count ?? 0) > 0) return { message: tr("Ai trimis deja o recenzie pentru acest curs.") };
  const { error } = await admin.from("testimonials").insert({
    author_name: profile.full_name ?? tr("Cursant"),
    author_title: [profile.specialization, course.title].filter(Boolean).join(", "),
    quote: parsed.data.quote,
    is_published: false,
    verified: true,
    user_id: profile.id,
    course_id: courseId,
    sort_order: 100,
  });
  if (error) return { message: tr("Recenzia nu a putut fi trimisă.") };
  return { message: tr("Mulțumim! Recenzia va apărea pe site după aprobarea echipei.") };
}
