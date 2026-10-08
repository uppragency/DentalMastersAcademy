import { createClient } from "@/lib/supabase/server";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, summary, location, starts_at, ends_at, parking_info, bring_info, schedule")
    .eq("slug", slug)
    .maybeSingle();
  if (!course?.starts_at) return new Response("Not found", { status: 404 });

  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("course_id", course.id).maybeSingle();
  if (!enrollment) return new Response("Forbidden", { status: 403 });

  const sched = (course.schedule as { title: string; items: { time: string; text: string }[] }[] | null) ?? [];
  const description = [
    course.summary,
    ...sched.map((d) => `${d.title}: ${d.items.map((i) => `${i.time} ${i.text}`).join("; ")}`),
    course.parking_info ? `Parcare: ${course.parking_info}` : null,
    course.bring_info ? `Ce să aduci: ${course.bring_info}` : null,
  ].filter(Boolean).join("\n");
  const end = course.ends_at ?? new Date(new Date(course.starts_at).getTime() + 8 * 3_600_000).toISOString();
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dental Masters Academy//RO",
    "BEGIN:VEVENT",
    `UID:${course.id}@dentalmastersacademy`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(course.starts_at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(course.title)}`,
    course.location ? `LOCATION:${esc(course.location)}` : "",
    description ? `DESCRIPTION:${esc(description)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Mâine: ${course.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.ics"`, "Cache-Control": "private, no-store" },
  });
}
