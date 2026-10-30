"use client";

import { useT } from "@/lib/i18n/client";
import Link from "@/components/locale-link";
import { useActionState } from "react";
import { login, signup, type FormState } from "@/actions/auth";
import { Button, Field } from "@/components/ui";

function Message({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">
      {state.message}
    </p>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const tr = useT();
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={tr("Email")} name="email" type="email" autoComplete="email" required error={state?.errors?.email?.[0]} />
      <Field label={tr("Parolă")} name="password" type="password" autoComplete="current-password" required error={state?.errors?.password?.[0]} />
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Se verifică..." : "Intră în cont"}</Button>
      <p className="text-center text-sm text-muted">
        {tr("Nu ai cont?")}{" "}<Link href={`/inregistrare${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-foreground underline underline-offset-4">{tr("Creează unul")}</Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const tr = useT();
  const [state, action, pending] = useActionState(signup, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={tr("Nume complet")} name="full_name" autoComplete="name" required error={e?.full_name?.[0]} />
      <Field label={tr("Email")} name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
      <Field label={tr("Telefon (opțional)")} name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
      <Field label={tr("Specializare (opțional)")} name="specialization" error={e?.specialization?.[0]} />
      <Field label={tr("Parolă")} name="password" type="password" autoComplete="new-password" required minLength={8} error={e?.password?.[0]} />
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Se creează contul..." : "Creează cont"}</Button>
      <p className="text-center text-sm text-muted">
        {tr("Ai deja cont?")}{" "}<Link href="/autentificare" className="font-medium text-foreground underline underline-offset-4">{tr("Intră în cont")}</Link>
      </p>
    </form>
  );
}
