import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GDPR access request: everything stored about the signed-in user, as JSON. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Neautorizat", { status: 401 });
  const id = auth.user.id;
  const admin = createAdminClient();
  const one = async (table: string, col: string) => (await admin.from(table).select("*").eq(col, id)).data ?? [];

  const [profile, billing, orders, enrollments, feedback, notifications, points, transfers, views, notes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle().then((r) => r.data),
    one("billing_profiles", "user_id"),
    admin.from("orders").select("*, order_items(*)").eq("user_id", id).then((r) => r.data ?? []),
    admin.from("enrollments").select("*, certificates(number, days_attended, issued_at)").eq("user_id", id).then((r) => r.data ?? []),
    one("course_feedback", "user_id"),
    one("notifications", "user_id"),
    one("points_ledger", "user_id"),
    one("seat_transfers", "from_user"),
    one("course_views", "user_id"),
    one("lesson_progress", "user_id"),
  ]);
  const body = JSON.stringify({ exported_at: new Date().toISOString(), email: auth.user.email, profile, billing_profiles: billing, orders, enrollments, feedback, notifications, points_ledger: points, seat_transfers: transfers, course_views: views, lesson_progress: notes }, null, 2);
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="datele-mele.json"', "Cache-Control": "private, no-store" },
  });
}
