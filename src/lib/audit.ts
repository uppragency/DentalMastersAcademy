import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a staff action in audit_log. Database triggers cannot know the actor when the service client is used,
 * so server actions call this explicitly. Never throws.
 */
export async function logAudit(actor: string, action: string, target: string, details: Record<string, unknown> = {}) {
  try {
    await createAdminClient().from("audit_log").insert({ actor, table_name: "admin", row_id: target, action, new_data: details });
  } catch (e) {
    console.error("audit insert failed", e);
  }
}
