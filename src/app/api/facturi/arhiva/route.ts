import { zipSync } from "fflate";
import { createClient } from "@/lib/supabase/server";

/** ZIP with every issued invoice of the signed-in user for one year (?an=2026). */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Neautorizat", { status: 401 });

  const year = Number(new URL(request.url).searchParams.get("an")) || new Date().getFullYear();
  const { SMARTBILL_EMAIL: email, SMARTBILL_TOKEN: token, SMARTBILL_CIF: cif } = process.env;
  if (!email || !token || !cif) return new Response("Facturarea nu este configurată", { status: 503 });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, invoice_number, paid_at")
    .eq("user_id", auth.user.id)
    .not("invoice_number", "is", null)
    .gte("paid_at", `${year}-01-01T00:00:00Z`)
    .lt("paid_at", `${year + 1}-01-01T00:00:00Z`)
    .limit(100);
  if (!orders || orders.length === 0) return new Response("Nu există facturi în acest an", { status: 404 });

  const files: Record<string, Uint8Array> = {};
  const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
  for (const o of orders) {
    const [series, ...rest] = (o.invoice_number as string).split(" ");
    const number = rest.join(" ");
    try {
      const res = await fetch(
        `https://ws.smartbill.ro/SBORO/api/invoice/pdf?cif=${encodeURIComponent(cif)}&seriesname=${encodeURIComponent(series)}&number=${encodeURIComponent(number)}`,
        { headers: { Accept: "application/octet-stream", Authorization: authHeader } },
      );
      if (res.ok) files[`factura-${series}-${number}.pdf`] = new Uint8Array(await res.arrayBuffer());
    } catch {
      /* skip invoices that cannot be fetched */
    }
  }
  if (Object.keys(files).length === 0) return new Response("Facturile nu au putut fi descărcate", { status: 502 });
  return new Response(Buffer.from(zipSync(files, { level: 0 })), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="facturi-${year}.zip"`, "Cache-Control": "private, no-store" },
  });
}
