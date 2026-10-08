"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/actions/commerce";
import { Button, Field } from "@/components/ui";

export function WaitlistForm({ courseId, tone = "light" }: { courseId: string | null; tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(joinWaitlist.bind(null, courseId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <Field label="Nume complet" name="name" autoComplete="name" required error={e?.name?.[0]} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
      <Field label="Telefon (opțional)" name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
      {courseId === null ? <Field label="Cursul dorit" name="desired_course" error={e?.desired_course?.[0]} /> : null}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm text-foreground">{state.message}</p> : null}
      <Button type="submit" variant={tone === "dark" ? "gold" : "primary"} disabled={pending} className="w-full">
        {pending ? "Se trimite..." : "Anunță-mă când se deschid înscrierile"}
      </Button>
    </form>
  );
}
