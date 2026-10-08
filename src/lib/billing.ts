import * as z from "zod";

export type BillingProfile = {
  id: string;
  kind: "individual" | "company";
  name: string;
  cui: string | null;
  reg_com: string | null;
  address: string;
  city: string;
  county: string;
  country: string;
};

/** Romanian CUI/CIF checksum (control key 753217532). Accepts optional "RO" prefix. */
export function validCui(raw: string) {
  const digits = raw.replace(/^RO/i, "").trim();
  if (!/^\d{2,10}$/.test(digits)) return false;
  const key = [7, 5, 3, 2, 1, 7, 5, 3, 2];
  const body = digits.slice(0, -1).padStart(9, "0");
  const sum = body.split("").reduce((s, d, i) => s + Number(d) * key[i]!, 0);
  const control = (sum * 10) % 11 % 10;
  return control === Number(digits.at(-1));
}

const base = {
  name: z.string().trim().min(2, { error: "Completează numele." }).max(200),
  address: z.string().trim().min(3, { error: "Completează adresa." }).max(300),
  city: z.string().trim().min(2, { error: "Completează localitatea." }).max(100),
  county: z.string().trim().min(2, { error: "Completează județul." }).max(100),
};

export const billingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("individual"), ...base }),
  z.object({
    kind: z.literal("company"),
    ...base,
    cui: z
      .string()
      .trim()
      .toUpperCase()
      .refine(validCui, { error: "CUI invalid. Verifică cifrele (ex. RO12345678)." }),
    reg_com: z.string().trim().max(40).optional(),
  }),
]);

export type BillingInput = z.infer<typeof billingSchema>;

export function readBilling(formData: FormData) {
  const opt = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  };
  return billingSchema.safeParse({
    kind: formData.get("billing_kind"),
    name: formData.get("billing_name"),
    cui: opt("billing_cui"),
    reg_com: opt("billing_reg_com"),
    address: formData.get("billing_address"),
    city: formData.get("billing_city"),
    county: formData.get("billing_county"),
  });
}
