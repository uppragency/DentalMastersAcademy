"use client";

import { useActionState } from "react";
import { changeEmail, changePassword, deleteMyAccount, signOutEverywhere, updateProfile } from "@/actions/account";
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
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Oraș" name="city" defaultValue={profile.city ?? ""} autoComplete="address-level2" error={e?.city?.[0]} />
        <Field label="Clinică" name="clinic" defaultValue={profile.clinic ?? ""} autoComplete="organization" error={e?.clinic?.[0]} />
      </div>
      <Field label="Ani de experiență" name="experience_years" type="number" min="0" max="70" defaultValue={profile.experience_years ?? ""} error={e?.experience_years?.[0]} />
      <p className="text-xs text-muted">Specializarea și experiența ne ajută să îți recomandăm cursurile potrivite.</p>
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

export function EmailForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(changeEmail, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Email nou" name="email" type="email" autoComplete="email" placeholder={current} required error={e?.email?.[0]} />
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se trimite..." : "Schimbă emailul"}</Button>
    </form>
  );
}

export function SignOutAllForm() {
  return (
    <form action={signOutEverywhere}>
      <Button type="submit" variant="ghost">Ieși din cont pe toate dispozitivele</Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteMyAccount, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Scrie ȘTERGE pentru confirmare" name="confirm" autoComplete="off" required />
      <Status message={state?.message} />
      <Button type="submit" disabled={pending} className="bg-red-700 hover:bg-red-800">{pending ? "Se șterge..." : "Șterge contul"}</Button>
    </form>
  );
}
