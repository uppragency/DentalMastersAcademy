import { createClient } from "@/lib/supabase/server";

/** Streams the SmartBill PDF of a proforma to the order's owner. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Neautorizat", { status: 401 });
  // RLS restricts orders to the owner (and staff).
  const { data: order } = await supabase.from("orders").select("proforma_number").eq("id", id).maybeSingle();
  if (!order?.proforma_number) return new Response("Proforma nu este disponibilă", { status: 404 });

  const { SMARTBILL_EMAIL: email, SMARTBILL_TOKEN: token, SMARTBILL_CIF: cif } = process.env;
  if (!email || !token || !cif) return new Response("Proformele nu sunt configurate", { status: 503 });
  const [series, ...rest] = order.proforma_number.split(" ");
  const number = rest.join(" ");
  const url = `https://ws.smartbill.ro/SBORO/api/estimate/pdf?cif=${encodeURIComponent(cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/octet-stream", Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}` } });
    if (!res.ok) return new Response("Proforma nu a putut fi descărcată", { status: 502 });
    return new Response(res.body, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="proforma-${series}-${number}.pdf"`, "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response("Proforma nu a putut fi descărcată", { status: 502 });
  }
}
