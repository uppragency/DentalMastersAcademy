import { createClient } from "@supabase/supabase-js";

/** Cookie-free anon client for public reads (OG images, build-time data). Subject to RLS. */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
