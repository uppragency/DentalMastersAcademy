import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { unsubUrl } from "@/lib/unsub";
import { formatDateRange, formatPrice } from "@/lib/format";

type Admin = ReturnType<typeof createAdminClient>;
const day = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
const diffDays = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
const HOUR = 3_600_000;

type Person = { email: string; full_name: string | null; marketing_opt_out: boolean } | null;
const hello = (p: Person) => (p?.full_name ? `Bună, ${p.full_name}.` : "Bună.");

/** Post-purchase series (steps 2 and 4): what happens next, and the next course proposal. Idempotent via reminder_log. */
export async function runPostPurchase(admin: Admin) {
  const now = Date.now();
  const today = day(new Date(now));
  let nextSteps = 0;
  let proposals = 0;

  // Step 2: one day after purchase, for courses that have not started yet. Only recent enrollments (no backfill).
  const { data: fresh } = await admin
    .from("enrollments")
    .select("id, user_id, created_at, courses(slug, title, format, starts_at, ends_at, location, schedule), profiles(email, full_name, marketing_opt_out)")
    .gte("created_at", new Date(now - 72 * HOUR).toISOString())
    .lte("created_at", new Date(now - 20 * HOUR).toISOString());
  type E1 = { id: string; user_id: string; courses: { slug: string; title: string; format: string; starts_at: string | null; ends_at: string | null; location: string | null } | null; profiles: Person };
  for (const e of (fresh ?? []) as unknown as E1[]) {
    const c = e.courses;
    if (!c || !e.profiles?.email) continue;
    if (c.starts_at && diffDays(day(new Date(c.starts_at)), today) < 2) continue;
    const { data: logged } = await admin.from("reminder_log").select("kind").eq("enrollment_id", e.id).eq("kind", "next_steps").maybeSingle();
    if (logged) continue;
    const online = c.format !== "physical";
    const paragraphs = [
      hello(e.profiles),
      `Locul tău la ${c.title} este confirmat.${c.starts_at ? ` Data: ${formatDateRange(c.starts_at, c.ends_at)}.` : ""}`,
      online ? "Accesul la lecții este activ în cont. Poți începe oricând." : "Cu 7 zile înainte de curs primești programul detaliat, adresa, parcarea și lista cu ce să aduci.",
      "Dacă nu mai poți participa, îți poți transfera locul unui coleg sau muta înscrierea la o ediție viitoare, după regulile din pagina de rambursare și transfer.",
    ];
    const ok = await sendMail({ to: e.profiles.email, subject: `Ce urmează după înscrierea la ${c.title}`, heading: "Ce urmează", paragraphs, cta: { label: "Deschide cursul în cont", href: `/cont/cursuri/${c.slug}` }, kind: "next_steps", userId: e.user_id });
    if (ok) {
      await admin.from("reminder_log").insert({ enrollment_id: e.id, kind: "next_steps" });
      nextSteps++;
    }
  }

  // Step 4: four days after the course ended, propose the next course to those who attended.
  const { data: ended } = await admin.from("courses").select("id, title, category_id, ends_at, starts_at").eq("status", "published").not("starts_at", "is", null);
  const finished = (ended ?? []).filter((c) => diffDays(today, day(new Date(c.ends_at ?? c.starts_at!))) === 4);
  if (finished.length > 0) {
    const { data: upcoming } = await admin.from("courses").select("id, slug, title, summary, category_id, price_cents, currency, capacity, starts_at, ends_at").eq("status", "published").gt("starts_at", new Date(now).toISOString()).order("starts_at");
    const { data: enr } = await admin.from("enrollments").select("course_id");
    const taken = new Map<string, number>();
    for (const r of enr ?? []) taken.set(r.course_id, (taken.get(r.course_id) ?? 0) + 1);
    for (const fc of finished) {
      const { data: rows } = await admin.from("enrollments").select("id, user_id, profiles(email, full_name, marketing_opt_out)").eq("course_id", fc.id).eq("attended", true);
      for (const e of (rows ?? []) as unknown as { id: string; user_id: string; profiles: Person }[]) {
        if (!e.profiles?.email || e.profiles.marketing_opt_out) continue;
        const { data: logged } = await admin.from("reminder_log").select("kind").eq("enrollment_id", e.id).eq("kind", "next_course").maybeSingle();
        if (logged) continue;
        const { data: mine } = await admin.from("enrollments").select("course_id").eq("user_id", e.user_id);
        const owned = new Set((mine ?? []).map((m) => m.course_id));
        const open = (upcoming ?? []).filter((u) => !owned.has(u.id) && (!u.capacity || (taken.get(u.id) ?? 0) < u.capacity));
        const pick = open.find((u) => u.category_id && u.category_id === fc.category_id) ?? open[0];
        if (!pick) continue;
        const ok = await sendMail({
          to: e.profiles.email,
          subject: `Următorul pas după ${fc.title}`,
          heading: "Următorul pas",
          paragraphs: [hello(e.profiles), `Mulțumim că ai participat la ${fc.title}. Pentru a continua, îți recomandăm ${pick.title}, ${formatDateRange(pick.starts_at, pick.ends_at)}, ${formatPrice(pick.price_cents, pick.currency?.trim() || "EUR")}.`, ...(pick.summary ? [pick.summary] : []), "Statusul Gold și Platinum aduce reducere automată și puncte la fiecare achiziție."],
          cta: { label: "Vezi cursul", href: `/cursuri/${pick.slug}` },
          kind: "next_course",
          userId: e.user_id,
          unsubscribe: unsubUrl(e.user_id),
        });
        if (ok) {
          await admin.from("reminder_log").insert({ enrollment_id: e.id, kind: "next_course" });
          proposals++;
        }
      }
    }
  }
  return { nextSteps, proposals };
}

/** Logged-in visitors who opened a course page 3 times without enrolling get one email with answers to common objections. */
export async function runViewAlerts(admin: Admin) {
  const now = Date.now();
  const { data: rows } = await admin
    .from("course_views")
    .select("user_id, course_id, courses(slug, title, status, starts_at, ends_at, faqs, capacity)")
    .gte("views", 3)
    .is("alert_sent_at", null)
    .lt("last_view_at", new Date(now - 24 * HOUR).toISOString())
    .gt("last_view_at", new Date(now - 14 * 24 * HOUR).toISOString())
    .limit(100);
  type V = { user_id: string; course_id: string; courses: { slug: string; title: string; status: string; starts_at: string | null; ends_at: string | null; faqs: { q: string; a: string }[]; capacity: number | null } | null; profiles: Person };
  const list = (rows ?? []) as unknown as Omit<V, "profiles">[];
  const { data: people } = await admin.from("profiles").select("id, email, full_name, marketing_opt_out").in("id", list.map((r) => r.user_id));
  const byId = new Map((people ?? []).map((p) => [p.id, p as NonNullable<Person>]));
  let sent = 0;
  for (const row of list) {
    const v: V = { ...row, profiles: byId.get(row.user_id) ?? null };
    const c = v.courses;
    const mark = () => admin.from("course_views").update({ alert_sent_at: new Date().toISOString() }).eq("user_id", v.user_id).eq("course_id", v.course_id);
    const ref = c?.ends_at ?? c?.starts_at;
    if (!c || c.status !== "published" || !v.profiles?.email || v.profiles.marketing_opt_out || (ref && Date.parse(ref) < now)) {
      await mark();
      continue;
    }
    const { count: enrolled } = await admin.from("enrollments").select("id", { count: "exact", head: true }).eq("user_id", v.user_id).eq("course_id", v.course_id);
    if (enrolled) {
      await mark();
      continue;
    }
    const faqs = (c.faqs ?? []).slice(0, 3).map((f) => `${f.q} ${f.a}`);
    const paragraphs = [
      hello(v.profiles),
      `Ai vizitat de mai multe ori ${c.title}. Iată răspunsurile la întrebările frecvente.`,
      ...faqs,
      "Grupurile sunt de maximum 20 de participanți, iar locurile se ocupă în ordinea înscrierilor. Dacă nu mai poți participa, îți poți transfera locul sau muta înscrierea, conform politicii de rambursare.",
      "Ai o întrebare? Răspunde la acest email sau sună-ne.",
    ];
    const ok = await sendMail({ to: v.profiles.email, subject: `Întrebări despre ${c.title}`, heading: c.title, paragraphs, cta: { label: "Vezi cursul", href: `/cursuri/${c.slug}` }, kind: "view_alert", userId: v.user_id, unsubscribe: unsubUrl(v.user_id) });
    if (ok) {
      await mark();
      sent++;
    }
  }
  return { viewAlerts: sent };
}

/** On the first day of each month, sends administrators the previous month's numbers. Once per month via ops_alerts. */
export async function runMonthlyReport(admin: Admin) {
  const now = new Date();
  const today = day(now);
  if (!today.endsWith("-01")) return { report: false };
  const prev = new Date(now.getTime() - 5 * 24 * HOUR);
  const month = day(prev).slice(0, 7);
  const { data: first } = await admin.from("ops_alerts").upsert({ key: `report:${month}`, kind: "report", message: `Raport lunar ${month}` }, { onConflict: "key", ignoreDuplicates: true }).select("key");
  if (!first || first.length === 0) return { report: false };

  const from = new Date(`${month}-01T00:00:00+03:00`).toISOString();
  const to = new Date(`${today}T00:00:00+03:00`).toISOString();
  const [{ data: paid }, { data: items }, { count: pending }, { count: newUsers }, { data: courses }, { data: enr }] = await Promise.all([
    admin.from("orders").select("total_cents, refunded_cents").in("status", ["paid", "refunded"]).gte("paid_at", from).lt("paid_at", to),
    admin.from("order_items").select("courses(title), orders!inner(status, paid_at)").gte("orders.paid_at", from).lt("orders.paid_at", to).in("orders.status", ["paid", "refunded"]),
    admin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", from).lt("created_at", to),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", from).lt("created_at", to),
    admin.from("courses").select("id, title, capacity, starts_at").eq("status", "published").gt("starts_at", now.toISOString()).not("capacity", "is", null).order("starts_at"),
    admin.from("enrollments").select("course_id"),
  ]);
  const revenue = (paid ?? []).reduce((s, o) => s + o.total_cents - (o.refunded_cents ?? 0), 0);
  const orders = (paid ?? []).length;
  const conv = pending ? Math.round((orders / pending) * 100) : 0;
  const per = new Map<string, number>();
  for (const i of (items ?? []) as unknown as { courses: { title: string } | null }[]) if (i.courses) per.set(i.courses.title, (per.get(i.courses.title) ?? 0) + 1);
  const best = [...per.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}: ${n}`).join("; ") || "fără vânzări";
  const taken = new Map<string, number>();
  for (const r of enr ?? []) taken.set(r.course_id, (taken.get(r.course_id) ?? 0) + 1);
  const weak = (courses ?? []).filter((c) => (taken.get(c.id) ?? 0) / c.capacity! < 0.5).map((c) => `${c.title} (${taken.get(c.id) ?? 0}/${c.capacity})`).join("; ") || "niciunul";

  const { data: staff } = await admin.from("profiles").select("email").eq("role", "admin").is("disabled_at", null);
  const recipients = (staff ?? []).map((s) => s.email).filter(Boolean);
  if (recipients.length === 0) return { report: false };
  const ok = await sendMail({
    to: recipients,
    subject: `Raport lunar ${month}`,
    heading: `Raport lunar ${month}`,
    paragraphs: [
      `Venit net: ${formatPrice(revenue)}. Comenzi plătite: ${orders}. Comenzi inițiate: ${pending ?? 0}. Rată plată: ${conv}%.`,
      `Conturi noi: ${newUsers ?? 0}.`,
      `Înscrieri pe curs: ${best}.`,
      `Cursuri viitoare sub 50% ocupare: ${weak}.`,
    ],
    cta: { label: "Deschide rapoartele", href: "/admin/rapoarte" },
    kind: "report",
  });
  return { report: ok };
}
