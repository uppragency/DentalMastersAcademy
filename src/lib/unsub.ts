import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const unsubToken = (userId: string) => createHmac("sha256", secret()).update(`unsub:${userId}`).digest("hex").slice(0, 32);
export function validUnsubToken(userId: string, token: string) {
  if (!secret()) return false;
  const a = Buffer.from(unsubToken(userId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const unsubUrl = (userId: string) => `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro"}/dezabonare?u=${userId}&t=${unsubToken(userId)}`;
