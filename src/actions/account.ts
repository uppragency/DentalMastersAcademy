"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/actions/auth";
import { readBilling } from "@/lib/billing";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Introdu numele complet." }).max(120),
  phone: z.string().trim().max(40).optional(),
  specialization: z.string().trim().max(120).optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    specialization: formData.get("specialization") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { message: "Sesiunea a expirat. Intră din nou în cont." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      specialization: parsed.data.specialization ?? null,
    })
    .eq("id", userId);
  if (error) return { message: "Datele nu au putut fi salvate." };
  revalidatePath("/cont", "layout");
  return { message: "Datele au fost salvate." };
}

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Parola trebuie să aibă minimum 8 caractere." })
      .regex(/[a-zA-Z]/, { error: "Parola trebuie să conțină o literă." })
      .regex(/[0-9]/, { error: "Parola trebuie să conțină o cifră." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Parolele nu coincid." });

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: "Parola nu a putut fi schimbată. Încearcă din nou." };
  return { message: "Parola a fost schimbată." };
}

export async function deleteBillingProfile(id: string) {
  const supabase = await createClient();
  // RLS restricts deletion to the owner's rows
  await supabase.from("billing_profiles").delete().eq("id", id);
  revalidatePath("/cont/profil");
}

export async function addBillingProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = readBilling(formData);
  if (!parsed.success) {
    const fe = z.flattenError(parsed.error).fieldErrors as Record<string, string[]>;
    return { errors: Object.fromEntries(Object.entries(fe).map(([k, v]) => [`billing_${k}`, v])) };
  }
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { message: "Sesiunea a expirat. Intră din nou în cont." };
  const b = parsed.data;
  const { error } = await supabase.from("billing_profiles").insert({
    user_id: userId,
    kind: b.kind,
    name: b.name,
    cui: b.kind === "company" ? b.cui : null,
    reg_com: b.kind === "company" ? (b.reg_com ?? null) : null,
    address: b.address,
    city: b.city,
    county: b.county,
  });
  if (error) return { message: "Profilul nu a putut fi salvat." };
  revalidatePath("/cont/profil");
  return { message: "Profilul de facturare a fost adăugat." };
}
