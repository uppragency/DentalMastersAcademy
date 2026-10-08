import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { contact, directions } from "@/content/site";
import { processWaitlist } from "@/lib/waitlist";
import { sendRecoveryEmail } from "@/lib/orders-ops";
import { runMonthlyReport, runPostPurchase, runViewAlerts } from "@/lib/lifecycle";

export const runtime = "nodejs";

const day = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
const diffDays = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

type Enr = { id: string; user_id: string; profiles: { email: string; full_name: string | null } | null };

/** Runs daily (see vercel.json). Idempotent through reminder_log. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  try {
    const summary = await runDaily(admin);
    await admin.from("cron_runs").insert({ job: "daily", ok: true, summary });
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    const error = e instanceof Error ? e.message : "eroare necunoscută";
    await admin.from("cron_runs").insert({ job: "daily", ok: false, error });
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}

async function runDaily(admin: ReturnType<typeof createAdminClient>) {
  const { data: maintenance } = await admin.rpc("points_maintenance");
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
        paragraphs = [`Mulțumim că ai participat la ${c.title}. Evaluarea durează un minut și ne ajută să îmbunătățim următoarele ediții.`];
        href = `/cont/cursuri/${c.slug}#feedback`;
      } else {
        title = kind === "r7" ? `Cum te pregătești pentru ${c.title}` : `Mâine: ${c.title}`;
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
  const ops = await runOps(admin);
  const lifecycle = await runPostPurchase(admin);
  const views = await runViewAlerts(admin);
  const report = await runMonthlyReport(admin);
  return { sent, maintenance, ...ops, ...lifecycle, ...views, ...report };
}

/** Abandoned checkouts, waitlist offers, seat alerts and the daily problem digest for administrators. */
async function runOps(admin: ReturnType<typeof createAdminClient>) {
  const now = Date.now();
  const hourAgo = new Date(now - 3_600_000).toISOString();
  const dayAgo = new Date(now - 24 * 3_600_000).toISOString();

  // 1. One reminder for card checkouts left unpaid for more than an hour.
  const { data: abandoned } = await admin.from("orders").select("id").eq("status", "pending").eq("source", "stripe").is("recovery_sent_at", null).lt("created_at", hourAgo).gt("created_at", dayAgo).limit(100);
  let recovery = 0;
  for (const o of abandoned ?? []) if (await sendRecoveryEmail(o.id)) recovery++;

  // 2. Stripe sessions expire after 2 hours: close card orders unpaid for a day (points are released by trigger).
  const { data: stale } = await admin.from("orders").update({ status: "cancelled" }).eq("status", "pending").eq("source", "stripe").lt("created_at", dayAgo).select("id");

  // 2b. Bank transfer reservations past their deadline: cancel and tell the customer (seat is released).
  const { data: lapsed } = await admin.from("orders").update({ status: "cancelled" }).eq("status", "pending").eq("source", "transfer").lt("expires_at", new Date(now).toISOString()).select("id, user_id, order_items(courses(title, slug)), profiles!orders_user_id_fkey(email, full_name)");
  for (const l of (lapsed ?? []) as unknown as { id: string; user_id: string; order_items: { courses: { title: string; slug: string } | null }[]; profiles: { email: string; full_name: string | null } | null }[]) {
    const c = l.order_items[0]?.courses;
    if (!c || !l.profiles) continue;
    await sendMail({
      to: l.profiles.email,
      subject: `Rezervarea a expirat: ${c.title}`,
      heading: "Rezervarea locului a expirat",
      paragraphs: [
        `${l.profiles.full_name ? `Bună, ${l.profiles.full_name}.` : "Bună."} Nu am primit plata prin transfer pentru ${c.title} în termenul de 2 zile lucrătoare, așa că am eliberat locul.`,
        `Dacă ai făcut deja plata, scrie-ne și rezolvăm imediat. Poți și să reiei înscrierea, dacă mai sunt locuri.`,
      ],
      cta: { label: "Reia înscrierea", href: `/cursuri/${c.slug}/achizitie` },
      kind: "transfer",
      userId: l.user_id,
    });
  }

  // 3. Waitlists: offer free seats, expire old offers.
  const { data: courses } = await admin.from("courses").select("id, title, slug, capacity, starts_at").eq("status", "published").not("capacity", "is", null).gt("starts_at", new Date(now).toISOString());
  let offers = 0;
  const alerts: string[] = [];
  const { data: enr } = await admin.from("enrollments").select("course_id");
  const taken = new Map<string, number>();
  for (const e of enr ?? []) taken.set(e.course_id, (taken.get(e.course_id) ?? 0) + 1);
  for (const c of courses ?? []) {
    offers += await processWaitlist(c.id);
    const n = taken.get(c.id) ?? 0;
    const cap = c.capacity!;
    const daysLeft = Math.ceil((Date.parse(c.starts_at!) - now) / 86_400_000);
    const candidates: { key: string; msg: string }[] = [];
    if (n >= cap) candidates.push({ key: `seats100:${c.id}`, msg: `${c.title}: complet (${n}/${cap}).` });
    else if (n / cap >= 0.8) candidates.push({ key: `seats80:${c.id}`, msg: `${c.title}: aproape complet (${n}/${cap}).` });
    if (daysLeft <= 14 && daysLeft >= 0 && n / cap < 0.5) candidates.push({ key: `low14:${c.id}`, msg: `${c.title}: începe în ${daysLeft} zile și are doar ${n}/${cap} înscriși.` });
    for (const a of candidates) {
      const { data: inserted } = await admin.from("ops_alerts").upsert({ key: a.key, kind: "seats", message: a.msg }, { onConflict: "key", ignoreDuplicates: true }).select("key");
      if (inserted && inserted.length > 0) alerts.push(a.msg);
    }
  }

  // 4. Problems since yesterday.
  const [{ count: badEvents }, { count: badMails }, { count: badInvoices }] = await Promise.all([
    admin.from("stripe_events").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("email_log").select("id", { count: "exact", head: true }).in("status", ["failed", "bounced"]).gte("created_at", dayAgo),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid").not("invoice_error", "is", null),
  ]);
  const problems: string[] = [];
  if (badEvents) problems.push(`${badEvents} evenimente Stripe eșuate (plăți care pot să nu fi acordat accesul).`);
  if (badMails) problems.push(`${badMails} emailuri eșuate sau respinse în ultimele 24 de ore.`);
  if (badInvoices) problems.push(`${badInvoices} comenzi plătite cu eroare la facturare.`);

  let digest = false;
  if (alerts.length + problems.length > 0) {
    const { data: staff } = await admin.from("profiles").select("email").eq("role", "admin").is("disabled_at", null);
    const to = (staff ?? []).map((s) => s.email).filter(Boolean);
    if (to.length) {
      digest = await sendMail({
        to,
        subject: problems.length ? "Dental Masters Academy: probleme de verificat" : "Dental Masters Academy: alerte cursuri",
        heading: problems.length ? "Probleme de verificat" : "Alerte cursuri",
        paragraphs: [...problems, ...alerts],
        cta: { label: "Deschide Stare sistem", href: "/admin/sistem" },
        kind: "alert",
      });
    }
  }
  return { recovery, cancelled: stale?.length ?? 0, transferLapsed: lapsed?.length ?? 0, offers, alerts: alerts.length, problems: problems.length, digest };
}
