import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Billing = { kind: "individual" | "company"; name: string; cui?: string; reg_com?: string; address: string; city: string; county: string };

/**
 * Issues an invoice in SmartBill for a paid order, using the billing data saved at checkout.
 * Active only when SMARTBILL_EMAIL, SMARTBILL_TOKEN, SMARTBILL_CIF, SMARTBILL_SERIES,
 * SMARTBILL_TAX_NAME and SMARTBILL_TAX_PERCENT are set. Errors are stored on the order, never thrown.
 */
export async function issueInvoice(orderId: string) {
  const { SMARTBILL_EMAIL: email, SMARTBILL_TOKEN: token, SMARTBILL_CIF: cif, SMARTBILL_SERIES: series, SMARTBILL_TAX_NAME: taxName, SMARTBILL_TAX_PERCENT: taxPct } = process.env;
  if (!email || !token || !cif || !series || !taxName || taxPct === undefined) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("total_cents, currency, billing, invoice_number, profiles(email), order_items(final_price_cents, courses(title, slug))")
    .eq("id", orderId)
    .single();
  const order = data as unknown as {
    total_cents: number; currency: string; billing: Billing | null; invoice_number: string | null;
    profiles: { email: string } | null; order_items: { final_price_cents: number; courses: { title: string; slug: string } | null }[];
  } | null;
  if (!order || order.invoice_number || !order.billing) return;
  const b = order.billing;
  const currency = order.currency.trim();

  const body = {
    companyVatCode: cif,
    client: {
      name: b.name,
      vatCode: b.kind === "company" ? b.cui : undefined,
      regCom: b.kind === "company" ? b.reg_com : undefined,
      isTaxPayer: b.kind === "company" ? /^RO/i.test(b.cui ?? "") : false,
      address: b.address,
      city: b.city,
      county: b.county,
      country: "Romania",
      email: order.profiles?.email,
      saveToDb: false,
    },
    issueDate: new Date().toISOString().slice(0, 10),
    seriesName: series,
    isDraft: false,
    currency,
    language: "RO",
    precision: 2,
    sendEmail: true,
    products: order.order_items.map((i) => ({
      name: i.courses?.title ?? "Curs",
      code: i.courses?.slug,
      isDiscount: false,
      measuringUnitName: "buc",
      currency,
      quantity: 1,
      price: i.final_price_cents / 100,
      isTaxIncluded: true,
      taxName,
      taxPercentage: Number(taxPct),
      saveToDb: false,
      isService: true,
    })),
  };

  try {
    const res = await fetch("https://ws.smartbill.ro/SBORO/api/invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}` },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { number?: string; series?: string; message?: string; errorText?: string };
    if (!res.ok || !json.number) {
      await admin.from("orders").update({ invoice_error: (json.errorText ?? json.message ?? `HTTP ${res.status}`).slice(0, 300) }).eq("id", orderId);
      return;
    }
    await admin.from("orders").update({ invoice_number: `${json.series ?? series} ${json.number}`, invoice_error: null }).eq("id", orderId);
  } catch (err) {
    await admin.from("orders").update({ invoice_error: String(err).slice(0, 300) }).eq("id", orderId);
  }
}
