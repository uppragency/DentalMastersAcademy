import { createClient } from "@/lib/supabase/server";

/** Streams the SmartBill PDF of an invoice to the order's owner. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Neautorizat", { status: 401 });
  // RLS restricts orders to the owner (and staff).
  const { data: order } = await supabase.from("orders").select("invoice_number").eq("id", id).maybeSingle();
  if (!order?.invoice_number) return new Response("Factura nu este disponibilă", { status: 404 });

  const { SMARTBILL_EMAIL: email, SMARTBILL_TOKEN: token, SMARTBILL_CIF: cif } = process.env;
  if (!email || !token || !cif) return new Response("Facturarea nu este configurată", { status: 503 });
  const [series, ...rest] = order.invoice_number.split(" ");
  const number = rest.join(" ");
  const url = `https://ws.smartbill.ro/SBORO/api/invoice/pdf?cif=${encodeURIComponent(cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/octet-stream", Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}` } });
    if (!res.ok) return new Response("Factura nu a putut fi descărcată", { status: 502 });
    return new Response(res.body, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="factura-${series}-${number}.pdf"`, "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response("Factura nu a putut fi descărcată", { status: 502 });
  }
}
