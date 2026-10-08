import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { contact } from "@/content/site";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Adeverință de participare", robots: { index: false } };

export default async function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/autentificare?next=/cont/cursuri/${slug}/adeverinta`);
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id, title, starts_at, ends_at, location").eq("slug", slug).maybeSingle();
  if (!course) notFound();
  const { data: enr } = await supabase.from("enrollments").select("id, attended").eq("user_id", profile.id).eq("course_id", course.id).maybeSingle();
  if (!enr?.attended) redirect(`/cont/cursuri/${slug}`);
  const { data: cert } = await supabase.from("certificates").select("number, days_attended").eq("enrollment_id", enr.id).maybeSingle();
  let number = cert?.number;
  if (!number) {
    // Attendance marked before certificates existed: issue it now (idempotent).
    const { data } = await createAdminClient().rpc("issue_certificate", { p_enrollment: enr.id });
    number = data ?? undefined;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-line bg-card p-10 sm:p-16 print:border-0 print:p-0">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Dental Masters Academy</p>
      <h1 className="font-display mt-6 text-center text-4xl">Adeverință de participare</h1>
      <p className="mt-10 text-center text-lg leading-relaxed">
        Se certifică faptul că <strong>{profile.full_name ?? profile.email}</strong> a participat la cursul
      </p>
      <p className="font-display mt-4 text-center text-3xl">{course.title}</p>
      <p className="mt-4 text-center text-muted">{formatDateRange(course.starts_at, course.ends_at)}{course.location ? `, ${course.location}` : ""}</p>
      {number ? (
        <p className="mt-10 text-center text-sm">
          Număr adeverință: <strong className="font-mono">{number}</strong>
          <span className="mt-1 block text-xs text-muted">Se verifică la {site.replace(/^https?:\/\//, "")}/verificare/{number}</span>
        </p>
      ) : null}
      <p className="mt-10 text-center text-sm text-muted">{contact.address} · {contact.email}</p>
      <div className="mt-10 flex justify-center print:hidden"><PrintButton /></div>
    </div>
  );
}
