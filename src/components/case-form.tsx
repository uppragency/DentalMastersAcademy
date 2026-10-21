"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { prepareCaseUploads, submitCase } from "@/actions/cases";
import { Button, Field } from "@/components/ui";
import { CASE_EXTENSIONS, MAX_CASE_FILES, MAX_CASE_FILE_BYTES } from "@/lib/case-files";
import { createClient } from "@/lib/supabase/client";

type Kind = "doctor" | "patient";

const copy: Record<Kind, { cta: string; messageLabel: string; filesLabel: string; consent: string; hint: string }> = {
  doctor: {
    cta: "Trimite un caz",
    messageLabel: "Descrierea cazului",
    filesLabel: "Investigații (scanări intraorale, radiografii, CBCT)",
    consent: "Sunt de acord ca Dental Masters Academy să prelucreze datele și investigațiile trimise pentru a analiza cazul, conform Politicii de confidențialitate. Confirm că investigațiile sunt anonimizate sau că am acordul pacientului pentru transmitere.",
    hint: "Fișierele sunt recomandate pentru o analiză completă.",
  },
  patient: {
    cta: "Solicită o evaluare",
    messageLabel: "Cu ce problemă te confrunți?",
    filesLabel: "Investigații disponibile (opțional)",
    consent: "Sunt de acord ca Dental Masters Academy să prelucreze datele mele de contact și datele despre sănătate din solicitare și din fișierele atașate, pentru a mă contacta și a evalua cazul, conform Politicii de confidențialitate.",
    hint: "Poți trimite solicitarea și fără investigații.",
  },
};

export function CaseForm({ kind }: { kind: Kind }) {
  const c = copy[kind];
  const [state, action, pending] = useActionState(submitCase, undefined);
  const [filesJson, setFilesJson] = useState("[]");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const e = state?.errors;

  if (state?.done) return <p role="status" className="rounded-2xl bg-gold-soft px-5 py-4">{state.message}</p>;

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = form.current;
    if (!f) return;
    setError(null);
    const input = f.elements.namedItem("attachments") as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    startTransition(async () => {
      let uploaded: { path: string; name: string; size: number }[] = [];
      if (files.length > 0) {
        if (files.length > MAX_CASE_FILES) return setError(`Poți atașa cel mult ${MAX_CASE_FILES} fișiere.`);
        const big = files.find((x) => x.size > MAX_CASE_FILE_BYTES);
        if (big) return setError(`Fișierul ${big.name} depășește 50 MB.`);
        setProgress("Se pregătește încărcarea...");
        const prep = await prepareCaseUploads(files.map((x) => ({ name: x.name, size: x.size })), String((f.elements.namedItem("website") as HTMLInputElement).value));
        if (!prep.ok) {
          setProgress(null);
          return setError(prep.message);
        }
        const supabase = createClient();
        for (const [i, u] of prep.uploads.entries()) {
          setProgress(`Se încarcă fișierul ${i + 1} din ${files.length}...`);
          const { error: upErr } = await supabase.storage.from("cases").uploadToSignedUrl(u.path, u.token, files[i]!);
          if (upErr) {
            setProgress(null);
            return setError(`Fișierul ${u.name} nu a putut fi încărcat. Încearcă din nou.`);
          }
          uploaded = [...uploaded, { path: u.path, name: u.name, size: files[i]!.size }];
        }
        setProgress(null);
      }
      const data = new FormData(f);
      data.delete("attachments");
      data.set("files", JSON.stringify(uploaded));
      setFilesJson(JSON.stringify(uploaded));
      action(data);
    });
  };

  const working = busy || pending;
  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="files" value={filesJson} readOnly />
      <Field label="Nume și prenume" name="name" autoComplete="name" required error={e?.name?.[0]} id={`${kind}-name`} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" required error={e?.email?.[0]} id={`${kind}-email`} />
        <Field label="Telefon" name="phone" type="tel" autoComplete="tel" required error={e?.phone?.[0]} id={`${kind}-phone`} />
      </div>
      <div>
        <label htmlFor={`${kind}-message`} className="mb-1.5 block text-sm font-medium">{c.messageLabel}</label>
        <textarea id={`${kind}-message`} name="message" rows={6} required className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold" />
        {e?.message?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.message[0]}</p> : null}
      </div>
      <div>
        <label htmlFor={`${kind}-files`} className="mb-1.5 block text-sm font-medium">{c.filesLabel}</label>
        <input id={`${kind}-files`} name="attachments" type="file" multiple accept={CASE_EXTENSIONS.map((x) => `.${x}`).join(",")} className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white" />
        <p className="mt-1.5 text-xs text-muted">{c.hint} Maximum {MAX_CASE_FILES} fișiere, 50 MB fiecare. Formate: PDF, JPG, PNG, WebP, HEIC, ZIP, DICOM (.dcm), STL, PLY, OBJ.</p>
      </div>
      <div className="hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[#a9833d]" />
        <span>{c.consent}</span>
      </label>
      {e?.consent?.[0] ? <p className="text-sm text-red-700">{e.consent[0]}</p> : null}
      {progress ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{progress}</p> : null}
      {error || state?.message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error ?? state?.message}</p> : null}
      <Button type="submit" disabled={working} className="w-full sm:w-auto">{working ? "Se trimite..." : c.cta}</Button>
    </form>
  );
}
