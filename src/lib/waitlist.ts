import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";

const OFFER_HOURS = 48;

/**
 * When seats are free, offers them to the next people on a course's waitlist (first come, first served).
 * Each offer is a 48 hour priority window. Offers that expired without enrollment free the slot for the next person.
 */
export async function processWaitlist(courseId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id, title, slug, capacity, status, starts_at, ends_at").eq("id", courseId).maybeSingle();
  if (!course || course.status !== "published" || !course.capacity) return 0;
  const end = course.ends_at ?? course.starts_at;
  if (end && new Date(end).getTime() < Date.now()) return 0;

  const [{ count: taken }, { data: rows }] = await Promise.all([
    admin.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", courseId),
    admin.from("waitlist").select("id, email, name, notified_at, offer_expires_at").eq("course_id", courseId).order("created_at"),
  ]);
  const now = Date.now();
  const list = rows ?? [];
  const activeOffers = list.filter((w) => w.offer_expires_at && new Date(w.offer_expires_at).getTime() > now).length;
  let free = course.capacity - (taken ?? 0) - activeOffers;
  let sent = 0;
  for (const w of list) {
    if (free <= 0) break;
    if (w.notified_at) continue;
    const expires = new Date(now + OFFER_HOURS * 3_600_000);
    const ok = await sendMail({
      to: w.email,
      subject: `S-a eliberat un loc: ${course.title}`,
      heading: "Un loc s-a eliberat",
      paragraphs: [
        `${w.name ? `Bună, ${w.name}.` : "Bună."} Un loc la ${course.title} s-a eliberat și ți l-am oferit primul, pentru că ești pe lista de așteptare.`,
        `Ai ${OFFER_HOURS} de ore să te înscrii. După acest termen oferim locul următoarei persoane de pe listă.`,
      ],
      cta: { label: "Rezervă locul", href: `/cursuri/${course.slug}` },
      kind: "waitlist",
    });
    if (!ok) continue;
    await admin.from("waitlist").update({ notified_at: new Date(now).toISOString(), offer_expires_at: expires.toISOString() }).eq("id", w.id);
    free--;
    sent++;
  }
  return sent;
}
