"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "@/actions/account";
import { Button, Field } from "@/components/ui";
import type { Profile } from "@/lib/types";

function Status({ message }: { message?: string }) {
  return message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" value={profile.email} readOnly disabled />
      <Field label="Nume complet" name="full_name" defaultValue={profile.full_name ?? ""} autoComplete="name" required error={e?.full_name?.[0]} />
      <Field label="Telefon" name="phone" type="tel" defaultValue={profile.phone ?? ""} autoComplete="tel" error={e?.phone?.[0]} />
      <Field label="Specializare" name="specialization" defaultValue={profile.specialization ?? ""} error={e?.specialization?.[0]} />
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Parolă nouă" name="password" type="password" autoComplete="new-password" minLength={8} required error={e?.password?.[0]} />
      <Field label="Confirmă parola" name="confirm" type="password" autoComplete="new-password" required error={e?.confirm?.[0]} />
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Schimbă parola"}</Button>
    </form>
  );
}
