"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startCheckout } from "@/actions/checkout";
import { Button, Field } from "@/components/ui";
import { BillingSection } from "@/components/billing-section";
import type { BillingProfile } from "@/lib/billing";

export function CheckoutForm({
  courseId,
  signedIn,
  enabled,
  free,
  next,
  billingProfiles,
  defaultName,
}: {
  courseId: string;
  signedIn: boolean;
  enabled: boolean;
  free: boolean;
  next: string;
  billingProfiles: BillingProfile[];
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(startCheckout.bind(null, courseId), undefined);
  const e = state?.errors;

  return (
    <form id="checkout-form" action={action} className="space-y-5">
      {!signedIn ? (
        <>
          <p className="text-sm text-muted">
            Setează emailul și parola cu care îți accesezi cursurile. Contul se creează la comandă, iar confirmarea ajunge pe email.
          </p>
          <Field label="Nume complet" name="full_name" autoComplete="name" required error={e?.full_name?.[0]} />
          <Field label="Email" name="email" type="email" autoComplete="email" required error={e?.email?.[0]} />
          <Field label="Parolă" name="password" type="password" autoComplete="new-password" minLength={8} required error={e?.password?.[0]} />
          <Field label="Telefon (opțional)" name="phone" type="tel" autoComplete="tel" error={e?.phone?.[0]} />
          <Field label="Specializare (opțional)" name="specialization" error={e?.specialization?.[0]} />
          <div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="accept_terms" required className="mt-1 size-4 accent-[#a9833d]" />
              <span>
                Sunt de acord cu <Link href="/termeni" className="underline underline-offset-4">Termenii și condițiile</Link> și cu{" "}
                <Link href="/confidentialitate" className="underline underline-offset-4">Politica de confidențialitate</Link>.
              </span>
            </label>
            {e?.accept_terms?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.accept_terms[0]}</p> : null}
          </div>
        </>
      ) : null}

      {!free ? (
        <>
          <div className="border-t border-line" />
          <BillingSection key={`${signedIn}`} profiles={billingProfiles} defaultName={defaultName} errors={e} />
        </>
      ) : null}

      {state?.message ? (
        <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">
          {state.message}{" "}
          {state.message.includes("Există deja un cont") ? (
            <Link href={`/autentificare?next=${encodeURIComponent(next)}`} className="font-medium underline underline-offset-4">Intră în cont</Link>
          ) : null}
        </p>
      ) : null}

      <Button type="submit" variant="gold" disabled={pending || (!enabled && !free)} className="w-full">
        {pending ? "Se procesează..." : free ? "Confirmă înscrierea" : "Continuă către plată"}
      </Button>
      {!enabled && !free ? <p className="text-center text-xs text-muted">Plata online va fi activată în curând.</p> : null}
    </form>
  );
}
