"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { anonymizeAccount } from "@/lib/anonymize";
import { getCurrentProfile } from "@/lib/data";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/actions/auth";
import { readBilling } from "@/lib/billing";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Introdu numele complet." }).max(120),
  phone: z.string().trim().max(40).optional(),
  specialization: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  clinic: z.string().trim().max(120).optional(),
  experience_years: z.coerce.number().int().min(0).max(70).optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    specialization: formData.get("specialization") || undefined,
    city: formData.get("city") || undefined,
    clinic: formData.get("clinic") || undefined,
    experience_years: formData.get("experience_years") || undefined,
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
      city: parsed.data.city ?? null,
      clinic: parsed.data.clinic ?? null,
      experience_years: parsed.data.experience_years ?? null,
    })
    .eq("id", userId);
  if (error) return { message: "Datele nu au putut fi salvate." };
  revalidatePath("/cont", "layout");
  return { message: "Datele au fost salvate." };
}

export async function saveTheme(theme: "light" | "dark") {
  if (theme !== "light" && theme !== "dark") return;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return;
  await supabase.from("profiles").update({ theme }).eq("id", userId);
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

export async function changeEmail(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().toLowerCase().email({ error: "Introdu un email valid." }).safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: [parsed.error.issues[0]!.message] } };
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.updateUser({ email: parsed.data }, { emailRedirectTo: `${site}/auth/callback?next=/cont/profil` });
  if (error) return { message: "Emailul nu a putut fi schimbat. Verifică adresa și încearcă din nou." };
  return { message: "Am trimis un link de confirmare. Emailul se schimbă după ce îl deschizi." };
}

/** Ends every session of this account, on all devices. */
export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/autentificare");
}

/** Self-service erasure. Orders and invoices are kept as required by law; everything personal is scrubbed. */
export async function deleteMyAccount(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Sesiunea a expirat. Intră din nou în cont." };
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "ȘTERGE") return { message: "Scrie ȘTERGE pentru confirmare." };
  if (profile.role === "admin" || profile.role === "operator") return { message: "Conturile de administrare nu se pot șterge din cont." };
  const admin = createAdminClient();
  const { data: enr } = await admin.from("enrollments").select("courses(ends_at, starts_at)").eq("user_id", profile.id);
  const upcoming = ((enr ?? []) as unknown as { courses: { ends_at: string | null; starts_at: string | null } | null }[]).some((e) => {
    const ref = e.courses?.ends_at ?? e.courses?.starts_at;
    return ref ? Date.parse(ref) > Date.now() : false;
  });
  if (upcoming) return { message: "Ai cursuri viitoare. Scrie-ne mai întâi pentru anulare sau rambursare, apoi poți șterge contul." };
  if (!(await anonymizeAccount(admin, profile.id))) return { message: "Ștergerea a eșuat. Scrie-ne și o rezolvăm." };
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/?cont=sters");
}
