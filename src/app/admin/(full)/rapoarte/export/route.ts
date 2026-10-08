import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/data";
import { getReports, parseRange } from "@/lib/report";

// Cells starting with = + - @ are prefixed so spreadsheet apps do not run them as formulas.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const eur = (c: number) => (c / 100).toFixed(2);

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const r = parseRange(sp.get("from") ?? undefined, sp.get("to") ?? undefined);
  const rep = await getReports(r.fromIso, r.toIso);
  const type = sp.get("type");
  let header: string[];
  let rows: unknown[][];
  if (type === "codes") {
    header = ["Cod", "Comenzi", "Reducere totala EUR"];
    rows = rep.codes.map((x) => [x.code, x.orders, eur(x.discountCents)]);
  } else if (type === "points") {
    header = ["Tip", "Puncte"];
    rows = rep.points.map((x) => [x.kind, x.points]);
  } else {
    header = ["Curs", "Comenzi", "Reduceri EUR", "Incasat EUR"];
    rows = rep.sales.map((x) => [x.course, x.orders, eur(x.discountCents), eur(x.revenueCents)]);
  }
  const csv = "﻿" + [header, ...rows].map((l) => l.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="raport-${type ?? "vanzari"}-${r.from}-${r.to}.csv"` } });
}
