import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { contact, directions } from "@/content/site";

export const runtime = "nodejs";

const day = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
const diffDays = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

type Enr = { id: string; user_id: string; profiles: { email: string; full_name: string | null } | null };

/** Runs daily (see vercel.json). Idempotent through reminder_log. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const today = day(new Date());
  const { data: courses } = await admin.from("courses").select("id, slug, title, starts_at, ends_at, location, parking_info, bring_info").eq("status", "published").not("starts_at", "is", null);
  let sent = 0;

  for (const c of courses ?? []) {
    const startDay = day(new Date(c.starts_at!));
    const endDay = day(new Date(c.ends_at ?? c.starts_at!));
    const until = diffDays(startDay, today);
    const sinceEnd = diffDays(today, endDay);
    const kind = until === 7 ? "r7" : until === 1 ? "r1" : sinceEnd === 1 ? "review" : null;
    if (!kind) continue;

    const { data: rows } = await admin.from("enrollments").select("id, user_id, profiles(email, full_name)").eq("course_id", c.id);
    for (const e of (rows ?? []) as unknown as Enr[]) {
      const { data: logged } = await admin.from("reminder_log").select("kind").eq("enrollment_id", e.id).eq("kind", kind).maybeSingle();
      if (logged) continue;

      const when = new Intl.DateTimeFormat("ro-RO", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(c.starts_at!));
      const parking = c.parking_info || directions.parking;
      const bring = c.bring_info;
      let title: string;
      let paragraphs: string[];
      let href = `/cont/cursuri/${c.slug}`;
      if (kind === "review") {
        title = "Cum a fost cursul?";
        paragraphs = [`Mulțumim că ai participat la ${c.title}. Părerea ta ne ajută: lasă o recenzie în contul tău.`];
      } else {
        title = kind === "r7" ? `Peste 7 zile: ${c.title}` : `Mâine: ${c.title}`;
        paragraphs = [
          `Data și ora: ${when}`,
          `Adresa: ${c.location || contact.address}`,
          ...(parking ? [`Parcare: ${parking}`] : []),
          ...(bring ? [`Ce să aduci: ${bring}`] : []),
        ];
        href = `/cont/cursuri/${c.slug}`;
      }

      await admin.from("notifications").insert({ user_id: e.user_id, kind: "info", title, body: paragraphs[0], href });
      if (e.profiles?.email) {
        await sendMail({ to: e.profiles.email, subject: title, heading: title, paragraphs: [e.profiles.full_name ? `Bună, ${e.profiles.full_name}.` : "Bună.", ...paragraphs], cta: { label: "Deschide în cont", href } });
      }
      await admin.from("reminder_log").insert({ enrollment_id: e.id, kind });
      sent++;
    }
  }
  return NextResponse.json({ ok: true, sent });
}
