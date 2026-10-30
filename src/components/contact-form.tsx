"use client";

import { useT } from "@/lib/i18n/client";
import { useActionState } from "react";
import { sendContact } from "@/actions/contact";
import { Button, Field } from "@/components/ui";

export function ContactForm() {
  const tr = useT();
  const [state, action, pending] = useActionState(sendContact, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label={tr("Nume")} name="name" autoComplete="name" required error={e?.name?.[0]} />
      <Field label={tr("Email")} name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
      <Field label={tr("Telefon (opțional)")} name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">{tr("Mesaj")}</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold"
        />
        {e?.message?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.message[0]}</p> : null}
      </div>
      <div className="hidden" aria-hidden="true">
        <label>{tr("Website")}<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Se trimite..." : "Trimite mesajul"}</Button>
    </form>
  );
}
