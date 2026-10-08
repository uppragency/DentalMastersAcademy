import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export function parseRange(from?: string, to?: string) {
  const ok = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const end = ok(to) ?? new Date().toISOString().slice(0, 10);
  const start = ok(from) ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  return { from: start, to: end, fromIso: `${start}T00:00:00+03:00`, toIso: `${end}T23:59:59+03:00` };
}

export type SalesRow = { course: string; orders: number; revenueCents: number; discountCents: number };
export type CodeRow = { code: string; orders: number; discountCents: number };
export type PointsRow = { kind: string; points: number };

export async function getReports(fromIso: string, toIso: string) {
  const admin = createAdminClient();
  const [{ data: orders }, { data: ledger }, { data: live }, { data: settings }] = await Promise.all([
    admin
      .from("orders")
      .select("total_cents, discount_cents, discount_code, source, order_items(final_price_cents, discount_cents, courses(title))")
      .eq("status", "paid")
      .gte("paid_at", fromIso)
      .lte("paid_at", toIso)
      .limit(5000),
    admin.from("points_ledger").select("kind, delta").gte("created_at", fromIso).lte("created_at", toIso).limit(20000),
    admin.from("points_ledger").select("remaining, expires_at").gt("remaining", 0),
    admin.from("loyalty_settings").select("point_value_cents").maybeSingle(),
  ]);

  const sales = new Map<string, SalesRow>();
  const codes = new Map<string, CodeRow>();
  for (const o of (orders ?? []) as unknown as { discount_code: string | null; discount_cents: number; order_items: { final_price_cents: number; discount_cents: number; courses: { title: string } | null }[] }[]) {
    for (const i of o.order_items) {
      const t = i.courses?.title ?? "Curs șters";
      const r = sales.get(t) ?? { course: t, orders: 0, revenueCents: 0, discountCents: 0 };
      r.orders += 1; r.revenueCents += i.final_price_cents; r.discountCents += i.discount_cents;
      sales.set(t, r);
    }
    if (o.discount_code) {
      const r = codes.get(o.discount_code) ?? { code: o.discount_code, orders: 0, discountCents: 0 };
      r.orders += 1; r.discountCents += o.discount_cents;
      codes.set(o.discount_code, r);
    }
  }
  const points = new Map<string, number>();
  for (const l of ledger ?? []) points.set(l.kind, (points.get(l.kind) ?? 0) + l.delta);
  const now = Date.now();
  const livePts = (live ?? []).filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now).reduce((s, r) => s + r.remaining, 0);

  return {
    sales: [...sales.values()].sort((a, b) => b.revenueCents - a.revenueCents),
    codes: [...codes.values()].sort((a, b) => b.orders - a.orders),
    points: [...points].map(([kind, p]) => ({ kind, points: p })) as PointsRow[],
    livePoints: livePts,
    pointValueCents: Number(settings?.point_value_cents ?? 5),
    orderCount: (orders ?? []).length,
  };
}
