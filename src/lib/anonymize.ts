import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

/** GDPR erasure: scrubs personal data and bans the login, keeps orders and invoices that must be retained. */
export async function anonymizeAccount(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<boolean> {
  const anon = `anonim-${userId.slice(0, 8)}@anonim.invalid`;
  const { error } = await admin.auth.admin.updateUserById(userId, { email: anon, ban_duration: "876000h", user_metadata: {} });
  if (error) return false;
  await admin
    .from("profiles")
    .update({ email: anon, full_name: "Cont anonimizat", phone: null, specialization: null, city: null, clinic: null, experience_years: null, theme: null, disabled_at: new Date().toISOString() })
    .eq("id", userId);
  const { data: enr } = await admin.from("enrollments").select("id").eq("user_id", userId);
  const ids = (enr ?? []).map((e) => e.id);
  if (ids.length > 0) await admin.from("certificates").update({ holder_name: "Participant anonimizat" }).in("enrollment_id", ids);
  await admin.from("billing_profiles").delete().eq("user_id", userId);
  await admin.from("user_notes").delete().eq("user_id", userId);
  await admin.from("course_views").delete().eq("user_id", userId);
  await admin.from("notifications").delete().eq("user_id", userId);
  await admin.from("seat_transfers").update({ status: "cancelled", decided_at: new Date().toISOString() }).eq("from_user", userId).eq("status", "pending");
  return true;
}
