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
    .select("total_cents, currency, billing, invoice_number, profiles!orders_user_id_fkey(email), order_items(final_price_cents, courses(title, slug))")
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

/**
 * Issues a proforma (SmartBill estimate) for a bank transfer order and emails it to the customer.
 * Active only when the invoice variables plus SMARTBILL_PROFORMA_SERIES are set. Never throws.
 */
export async function issueProforma(orderId: string): Promise<{ ok: boolean; message: string }> {
  const { SMARTBILL_EMAIL: email, SMARTBILL_TOKEN: token, SMARTBILL_CIF: cif, SMARTBILL_PROFORMA_SERIES: series, SMARTBILL_TAX_NAME: taxName, SMARTBILL_TAX_PERCENT: taxPct } = process.env;
  if (!email || !token || !cif || !series || !taxName || taxPct === undefined) return { ok: false, message: "SmartBill nu este configurat pentru proforme (SMARTBILL_PROFORMA_SERIES)." };

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("status, source, currency, billing, proforma_number, profiles!orders_user_id_fkey(email), order_items(final_price_cents, courses(title, slug))")
    .eq("id", orderId)
    .single();
  const order = data as unknown as {
    status: string; source: string; currency: string; billing: Billing | null; proforma_number: string | null;
    profiles: { email: string } | null; order_items: { final_price_cents: number; courses: { title: string; slug: string } | null }[];
  } | null;
  if (!order || order.status !== "pending" || order.source !== "transfer" || !order.billing) return { ok: false, message: "Comanda nu este un transfer în așteptare cu date de facturare." };
  if (order.proforma_number) return { ok: false, message: `Proforma ${order.proforma_number} a fost deja emisă.` };
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
    const res = await fetch("https://ws.smartbill.ro/SBORO/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}` },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { number?: string; series?: string; message?: string; errorText?: string };
    if (!res.ok || !json.number) return { ok: false, message: (json.errorText ?? json.message ?? `SmartBill a răspuns cu HTTP ${res.status}`).slice(0, 300) };
    await admin.from("orders").update({ proforma_number: `${json.series ?? series} ${json.number}` }).eq("id", orderId);
    return { ok: true, message: `Proforma ${json.series ?? series} ${json.number} a fost emisă și trimisă pe email.` };
  } catch (err) {
    return { ok: false, message: String(err).slice(0, 300) };
  }
}
