import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const campaign = req.nextUrl.searchParams.get("campanie");
  let q = createAdminClient().from("discount_codes").select("code, kind, value, used_count, max_uses, starts_at, expires_at, campaign, active").order("created_at", { ascending: false }).limit(5000);
  if (campaign) q = q.eq("campaign", campaign);
  const { data } = await q;
  const header = ["Cod", "Tip", "Valoare", "Folosit", "Max utilizari", "Start", "Expira", "Campanie", "Activ"];
  const rows = (data ?? []).map((c) => [c.code, c.kind, c.kind === "percent" ? c.value : (c.value / 100).toFixed(2), c.used_count, c.max_uses, c.starts_at?.slice(0, 10), c.expires_at?.slice(0, 10), c.campaign, c.active ? "da" : "nu"]);
  const csv = "﻿" + [header, ...rows].map((l) => l.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="coduri${campaign ? `-${campaign}` : ""}.csv"` } });
}
