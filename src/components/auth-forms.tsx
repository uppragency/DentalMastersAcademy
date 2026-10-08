"use client";

import Link from "next/link";
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
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={state?.errors?.email?.[0]} />
      <Field label="Parolă" name="password" type="password" autoComplete="current-password" required error={state?.errors?.password?.[0]} />
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Se verifică..." : "Intră în cont"}</Button>
      <p className="text-center text-sm text-muted">
        Nu ai cont? <Link href={`/inregistrare${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-foreground underline underline-offset-4">Creează unul</Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Nume complet" name="full_name" autoComplete="name" required error={e?.full_name?.[0]} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
      <Field label="Telefon (opțional)" name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
      <Field label="Specializare (opțional)" name="specialization" error={e?.specialization?.[0]} />
      <Field label="Parolă" name="password" type="password" autoComplete="new-password" required minLength={8} error={e?.password?.[0]} />
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Se creează contul..." : "Creează cont"}</Button>
      <p className="text-center text-sm text-muted">
        Ai deja cont? <Link href="/autentificare" className="font-medium text-foreground underline underline-offset-4">Intră în cont</Link>
      </p>
    </form>
  );
}
