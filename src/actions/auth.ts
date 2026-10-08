"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  // Cont creat fără verificare pe email (temporar, până avem mai mulți useri).
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return { message: exists ? "Există deja un cont cu acest email. Autentifică-te." : "Nu am putut crea contul. Verifică datele sau încearcă din nou." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/autentificare");
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
