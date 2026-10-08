import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

// Cells starting with = + - @ are prefixed so spreadsheet apps do not run them as formulas.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: course }, { data }] = await Promise.all([
    admin.from("courses").select("slug").eq("id", id).maybeSingle(),
    admin.from("enrollments").select("attended, created_at, source, profiles(full_name, email, phone, specialization), orders(billing, invoice_number)").eq("course_id", id).order("created_at"),
  ]);
  if (!course) return new NextResponse("Not found", { status: 404 });
  type R = { attended: boolean; created_at: string; source: string; profiles: { full_name: string | null; email: string; phone: string | null; specialization: string | null } | null; orders: { billing: { name?: string; cui?: string; address?: string; city?: string; county?: string } | null; invoice_number: string | null } | null };
  const header = ["Nume", "Email", "Telefon", "Specializare", "Sursa", "Data inscrierii", "Prezent", "Facturare nume", "CUI", "Adresa facturare", "Factura"];
  const lines = ((data ?? []) as unknown as R[]).map((r) => [
    r.profiles?.full_name, r.profiles?.email, r.profiles?.phone, r.profiles?.specialization, r.source, r.created_at.slice(0, 10), r.attended ? "da" : "nu",
    r.orders?.billing?.name, r.orders?.billing?.cui, [r.orders?.billing?.address, r.orders?.billing?.city, r.orders?.billing?.county].filter(Boolean).join(", "), r.orders?.invoice_number,
  ].map(cell).join(","));
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="participanti-${course.slug}.csv"` } });
}
