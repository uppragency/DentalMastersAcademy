import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { contact } from "@/content/site";

type PendingOrder = {
  id: string;
  status: string;
  source: string;
  total_cents: number;
  currency: string;
  user_id: string;
  recovery_sent_at: string | null;
  profiles: { email: string; full_name: string | null } | null;
  order_items: { courses: { title: string; slug: string } | null }[];
};

async function loadOrder(orderId: string) {
  const { data } = await createAdminClient()
    .from("orders")
    .select("id, status, source, total_cents, currency, user_id, recovery_sent_at, profiles(email, full_name), order_items(courses(title, slug))")
    .eq("id", orderId)
    .maybeSingle();
  return data as unknown as PendingOrder | null;
}

/** One reminder for an unpaid card checkout. Returns true when the email was sent. */
export async function sendRecoveryEmail(orderId: string): Promise<boolean> {
  const o = await loadOrder(orderId);
  const course = o?.order_items?.[0]?.courses;
  if (!o || o.status !== "pending" || o.source !== "stripe" || !o.profiles || !course) return false;
  const ok = await sendMail({
    to: o.profiles.email,
    subject: `Ți-ai păstrat locul? ${course.title}`,
    heading: "Comanda ta nu a fost finalizată",
    paragraphs: [
      `${o.profiles.full_name ? `Bună, ${o.profiles.full_name}.` : "Bună."} Ai început înscrierea la ${course.title}, dar plata nu s-a finalizat.`,
      `Poți relua oricând de unde ai rămas. Locurile sunt limitate, iar la noi grupele au maximum 20 de participanți.`,
    ],
    cta: { label: "Finalizează înscrierea", href: `/cursuri/${course.slug}/achizitie` },
    kind: "recovery",
    userId: o.user_id,
  });
  if (ok) await createAdminClient().from("orders").update({ recovery_sent_at: new Date().toISOString() }).eq("id", orderId);
  return ok;
}

/** Payment instructions for a bank transfer order. Bank details come from the admin content editor. */
export async function sendTransferInstructions(orderId: string): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient();
  const o = await loadOrder(orderId);
  const course = o?.order_items?.[0]?.courses;
  if (!o || o.status !== "pending" || o.source !== "transfer" || !o.profiles || !course) return { ok: false, message: "Comanda nu este o comandă prin transfer în așteptare." };
  const { data: bank } = await admin.from("site_content").select("value").eq("key", "private:bank").maybeSingle();
  const details = typeof bank?.value === "string" ? bank.value.trim() : "";
  if (!details) return { ok: false, message: "Completează mai întâi datele bancare în Conținut site." };
  const ok = await sendMail({
    to: o.profiles.email,
    subject: `Instrucțiuni de plată: ${course.title}`,
    heading: "Instrucțiuni de plată prin transfer bancar",
    paragraphs: [
      `${o.profiles.full_name ? `Bună, ${o.profiles.full_name}.` : "Bună."} Pentru înscrierea la ${course.title}, te rugăm să faci plata de ${formatPrice(o.total_cents, o.currency.trim())}.`,
      ...details.split("\n").map((l) => l.trim()).filter(Boolean),
      `Menționează la detalii: comanda ${o.id.slice(0, 8)}.`,
      `După plată, trimite dovada la ${contact.email}. Înscrierea se activează imediat ce confirmăm plata.`,
    ],
    kind: "transfer",
    userId: o.user_id,
  });
  return ok ? { ok: true, message: "Instrucțiunile au fost trimise." } : { ok: false, message: "Emailul nu a putut fi trimis." };
}
