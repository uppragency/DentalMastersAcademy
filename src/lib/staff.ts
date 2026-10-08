import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

/** Admin or operator. Reads and writes then go through the service client, after this check. */
export async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/admin");
  if (profile.role !== "admin" && profile.role !== "operator") redirect("/cont");
  return { profile, admin: createAdminClient(), isAdmin: profile.role === "admin" };
}

/** Full administrators only. */
export async function requireFullAdmin() {
  const s = await requireStaff();
  if (!s.isAdmin) redirect("/admin");
  return s;
}
