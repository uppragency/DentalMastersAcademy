"use server";

import { getLocale, tr } from "@/lib/i18n/server";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/actions/auth";
import { sendMail } from "@/lib/email";
import { inbox } from "@/content/mailboxes";

const schema = z.object({
  name: z.string().trim().min(2, { error: () => tr("Introdu numele.") }).max(120),
  email: z.email({ error: () => tr("Introdu o adresă de email validă.") }).trim(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5, { error: () => tr("Mesajul este prea scurt.") }).max(4000),
  website: z.string().max(0).optional(), // honeypot
});

export async function sendContact(_: FormState, formData: FormData): Promise<FormState> {
  await getLocale();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (parsed.data.website) return { message: tr("Mulțumim! Am primit mesajul.") };
  const { website: _hp, ...row } = parsed.data;
  void _hp;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(row);
  if (error) return { message: tr("Mesajul nu a putut fi trimis. Încearcă din nou.") };
  // Notificare către echipă; răspunsul din căsuța poștală ajunge direct la persoana care a scris.
  await sendMail({
    to: inbox("contact"),
    subject: tr("Mesaj nou de la {name}", { name: row.name }),
    heading: tr("Mesaj nou din formularul de contact"),
    paragraphs: [`Nume: ${row.name}`, `Email: ${row.email}`, ...(row.phone ? [`Telefon: ${row.phone}`] : []), `Mesaj: ${row.message}`],
    kind: "alert",
    replyTo: row.email,
  });
  return { message: tr("Mulțumim! Am primit mesajul și revenim în cel mai scurt timp.") };
}
