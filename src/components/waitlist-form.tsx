"use client";

import { useT } from "@/lib/i18n/client";
import { useActionState } from "react";
import { joinWaitlist } from "@/actions/commerce";
import { Button, Field } from "@/components/ui";

export function WaitlistForm({ courseId, tone = "light" }: { courseId: string | null; tone?: "light" | "dark" }) {
  const tr = useT();
  const [state, action, pending] = useActionState(joinWaitlist.bind(null, courseId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <Field label={tr("Nume complet")} name="name" autoComplete="name" required error={e?.name?.[0]} />
      <Field label={tr("Email")} name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
      <Field label={tr("Telefon (opțional)")} name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
      {courseId === null ? <Field label={tr("Cursul dorit")} name="desired_course" error={e?.desired_course?.[0]} /> : null}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm text-foreground">{state.message}</p> : null}
      <Button type="submit" variant={tone === "dark" ? "gold" : "primary"} disabled={pending} className="w-full">
        {pending ? "Se trimite..." : tr("Anunță-mă când se deschid înscrierile")}
      </Button>
    </form>
  );
}
