import type { Course } from "@/lib/types";

/** True while the early bird price applies. */
export function earlyActive(c: Pick<Course, "early_price_cents" | "early_until">, nowMs: number): boolean {
  return c.early_price_cents != null && c.early_until != null && Date.parse(c.early_until) > nowMs;
}

/**
 * Returns the course with the price that applies right now. While the early bird is active, price_cents is the early price
 * and old_price_cents shows the regular one (struck through). Mirrors public.course_effective_price in the database.
 */
export function withEffectivePrice<T extends Course>(c: T, nowMs: number): T {
  if (!earlyActive(c, nowMs)) return c;
  return { ...c, price_cents: c.early_price_cents!, old_price_cents: c.price_cents };
}
