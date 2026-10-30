"use server";

import { getLocale, tr } from "@/lib/i18n/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import * as z from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { inbox } from "@/content/mailboxes";
import { CASE_EXTENSIONS, MAX_CASE_FILES, MAX_CASE_FILE_BYTES, caseExtension, safeFileName } from "@/lib/case-files";
import { nowMs } from "@/lib/time";

export type PrepareResult =
  | { ok: true; prefix: string; uploads: { path: string; token: string; name: string }[] }
  | { ok: false; message: string };

async function ipHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0]!.trim();
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** Issues signed upload URLs so files go straight to private storage (no server body limit). */
export async function prepareCaseUploads(files: { name: string; size: number }[], honeypot: string): Promise<PrepareResult> {
  await getLocale();
  if (honeypot) return { ok: false, message: tr("Nu am putut încărca fișierele.") };
  if (files.length === 0) return { ok: true, prefix: "", uploads: [] };
  if (files.length > MAX_CASE_FILES) return { ok: false, message: tr("Poți atașa cel mult {mAX_CASE_FILES} fișiere.", { mAX_CASE_FILES: MAX_CASE_FILES }) };
  for (const f of files) {
    if (!CASE_EXTENSIONS.includes(caseExtension(f.name))) return { ok: false, message: tr("Formatul fișierului {name} nu este acceptat. Acceptăm {v2}.", { name: f.name, v2: CASE_EXTENSIONS.join(", ") }) };
    if (f.size > MAX_CASE_FILE_BYTES) return { ok: false, message: tr("Fișierul {name} depășește 50 MB.", { name: f.name }) };
    if (f.size <= 0) return { ok: false, message: tr("Fișierul {name} este gol.", { name: f.name }) };
  }
  const admin = createAdminClient();
  const hash = await ipHash();
  const since = new Date(nowMs() - 3_600_000).toISOString();
  const { data: recent } = await admin.from("case_upload_log").select("files").eq("ip_hash", hash).gte("created_at", since);
  const used = (recent ?? []).reduce((n, r) => n + r.files, 0);
  if (used + files.length > 24) return { ok: false, message: tr("Ai încărcat prea multe fișiere într-un timp scurt. Încearcă din nou peste o oră sau scrie-ne pe email.") };
  await admin.from("case_upload_log").insert({ ip_hash: hash, files: files.length });

  const prefix = crypto.randomUUID();
  const uploads: { path: string; token: string; name: string }[] = [];
  for (const [i, f] of files.entries()) {
    const path = `${prefix}/${i + 1}-${safeFileName(f.name)}`;
    const { data, error } = await admin.storage.from("cases").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, message: tr("Nu am putut pregăti încărcarea. Încearcă din nou.") };
    uploads.push({ path, token: data.token, name: f.name });
  }
  return { ok: true, prefix, uploads };
}

const schema = z.object({
  kind: z.enum(["doctor", "patient"]),
  name: z.string().trim().min(2, { error: () => tr("Introdu numele.") }).max(120),
  email: z.email({ error: () => tr("Introdu o adresă de email validă.") }).trim(),
  phone: z.string().trim().min(6, { error: () => tr("Introdu un număr de telefon.") }).max(40),
  message: z.string().trim().min(15, { error: () => tr("Descrie cazul în câteva rânduri.") }).max(5000),
  consent: z.literal("on", { error: () => tr("Acordul este necesar pentru a trimite solicitarea.") }),
  website: z.string().max(0).optional(),
});

export type CaseState = { message?: string; done?: boolean; errors?: Record<string, string[]> } | undefined;

export async function submitCase(_: CaseState, formData: FormData): Promise<CaseState> {
  await getLocale();
  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    consent: formData.get("consent") ?? undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  if (d.website) return { done: true, message: tr("Mulțumim! Am primit solicitarea.") };

  let files: { path: string; name: string; size: number }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("files") ?? "[]")) as unknown;
    if (Array.isArray(raw)) files = raw.filter((f): f is { path: string; name: string; size: number } => typeof f?.path === "string" && typeof f?.name === "string").slice(0, MAX_CASE_FILES);
  } catch {
    files = [];
  }
  const admin = createAdminClient();
  const { count: sentToday } = await admin.from("case_requests").select("id", { count: "exact", head: true }).eq("email", d.email).gte("created_at", new Date(nowMs() - 86_400_000).toISOString());
  if ((sentToday ?? 0) >= 5) return { message: tr("Ai trimis deja mai multe solicitări astăzi. Echipa revine către tine în cel mai scurt timp.") };

  // Keep only files that really exist in storage under a single upload folder.
  const folders = new Set(files.map((f) => f.path.split("/")[0]));
  if (folders.size > 1 || files.some((f) => !/^[0-9a-f-]{36}\/[\w.-]+$/.test(f.path))) return { message: tr("Fișierele atașate nu sunt valide. Reîncarcă pagina și încearcă din nou.") };
  if (files.length > 0) {
    const folder = files[0]!.path.split("/")[0]!;
    const { data: listed } = await admin.storage.from("cases").list(folder, { limit: 20 });
    const present = new Set((listed ?? []).map((o) => `${folder}/${o.name}`));
    files = files.filter((f) => present.has(f.path)).map((f) => ({ path: f.path, name: String(f.name).slice(0, 160), size: Number(f.size) || 0 }));
  }

  const { data: saved, error } = await admin
    .from("case_requests")
    .insert({ kind: d.kind, name: d.name, email: d.email, phone: d.phone, message: d.message, files, consent_at: new Date(nowMs()).toISOString() })
    .select("id")
    .single();
  if (error || !saved) return { message: tr("Solicitarea nu a putut fi trimisă. Încearcă din nou sau scrie-ne pe email.") };

  const doctor = d.kind === "doctor";
  after(async () => {
    await sendMail({
      to: inbox(doctor ? "medici" : "pacienti"),
      subject: tr("{v1}: {name}", { v1: doctor ? tr("Caz nou de la medic") : tr("Solicitare de evaluare de la pacient"), name: d.name }),
      heading: doctor ? tr("Caz nou trimis de un medic") : tr("Solicitare nouă de evaluare"),
      paragraphs: [`Nume: ${d.name}`, `Email: ${d.email}`, `Telefon: ${d.phone}`, tr("Fișiere atașate: {v1}", { v1: files.length }), tr("Detaliile și fișierele se văd în administrare, la Solicitări cazuri.")],
      cta: { label: tr("Deschide solicitarea"), href: "/admin/solicitari" },
      kind: "alert",
      replyTo: d.email,
    });
    await sendMail({
      to: d.email,
      subject: doctor ? tr("Am primit cazul tău") : tr("Am primit solicitarea ta"),
      heading: doctor ? tr("Am primit cazul tău") : tr("Am primit solicitarea ta"),
      paragraphs: [
        tr("Mulțumim. Echipa Dental Masters Academy analizează informațiile și revine către tine cu pașii următori."),
        doctor ? tr("Dacă ai investigații suplimentare, le poți trimite răspunzând la acest email.") : tr("Pentru urgențe, sună-ne la +40 724 065 767."),
      ],
      kind: "info",
    });
  });
  return { done: true, message: doctor ? tr("Mulțumim! Am primit cazul și revenim către tine în cel mai scurt timp.") : tr("Mulțumim! Am primit solicitarea și te contactăm pentru următorii pași.") };
}
