"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { errors?: Record<string, string[]>; message?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/cont";
}

const loginSchema = z.object({
  email: z.email({ error: "Introdu o adresă de email validă." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Introdu parola." }),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Email sau parolă incorecte." };

  redirect(safeNext(formData.get("next")));
}

const signupSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Introdu numele complet." }).max(120),
  email: z.email({ error: "Introdu o adresă de email validă." }).trim().toLowerCase(),
  phone: z.string().trim().max(40).optional(),
  specialization: z.string().trim().max(120).optional(),
  password: z
    .string()
    .min(8, { error: "Parola trebuie să aibă minimum 8 caractere." })
    .regex(/[a-zA-Z]/, { error: "Parola trebuie să conțină o literă." })
    .regex(/[0-9]/, { error: "Parola trebuie să conțină o cifră." }),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    specialization: formData.get("specialization") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { password, email, ...meta } = parsed.data;
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(formData.get("next")))}` },
  });
  if (error) return { message: "Nu am putut crea contul. Verifică datele sau încearcă din nou." };

  if (data.session) redirect(safeNext(formData.get("next")));
  return { message: "Ți-am trimis un email de confirmare. Deschide linkul din email pentru a-ți activa contul." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
