"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { startCheckout } from "@/actions/checkout";
import { Button, Field } from "@/components/ui";
import { BillingSection } from "@/components/billing-section";
import type { BillingProfile } from "@/lib/billing";
import type { PayMethod } from "@/lib/transfer";
import { checkoutTotals } from "@/lib/checkout-store";
import { CheckoutDraft } from "@/components/checkout-draft";
import { formatPrice } from "@/lib/format";
import { contact } from "@/content/site";

export function CheckoutForm({
  courseId,
  signedIn,
  enabled,
  free,
  next,
  billingProfiles,
  defaultName,
  methods,
  deadlineLabel,
  missingProfile,
  pendingTransfer,
}: {
  courseId: string;
  signedIn: boolean;
  enabled: boolean;
  free: boolean;
  next: string;
  billingProfiles: BillingProfile[];
  defaultName: string;
  methods: PayMethod[];
  deadlineLabel: string;
  missingProfile: { phone: boolean; specialization: boolean };
  pendingTransfer: { id: string; deadlineLabel: string } | null;
}) {
  const totals = useSyncExternalStore(checkoutTotals.subscribe, checkoutTotals.get, () => null);
  const [method, setMethod] = useState<PayMethod>(methods[0]!);
  const [state, action, pending] = useActionState(startCheckout.bind(null, courseId), undefined);
  const e = state?.errors;

  return (
    <form id="checkout-form" action={action} className="space-y-5">
      <CheckoutDraft formId="checkout-form" courseId={courseId} />
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
        </>
      ) : null}

      {pendingTransfer ? (
        <div role="status" className="rounded-2xl border border-gold bg-gold-soft p-5 text-sm leading-relaxed">
          <p className="font-semibold">Ai deja o comandă prin transfer bancar în așteptare.</p>
          <p className="mt-1 text-muted">
            Locul tău este rezervat până {pendingTransfer.deadlineLabel}. Dacă plătești acum cu cardul, comanda prin transfer se anulează automat după ce plata reușește.
          </p>
          <Link href={`/multumim/${pendingTransfer.id}`} className="mt-3 inline-block font-medium underline underline-offset-4">Vezi datele pentru transfer</Link>
        </div>
      ) : null}

      {signedIn && (missingProfile.phone || missingProfile.specialization) ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {missingProfile.phone ? <Field label="Telefon (opțional)" name="phone" type="tel" autoComplete="tel" /> : null}
          {missingProfile.specialization ? <Field label="Specializare (opțional)" name="specialization" /> : null}
          <p className="text-xs text-muted sm:col-span-2">Le salvăm în profilul tău, ca să nu le mai introduci data viitoare.</p>
        </div>
      ) : null}

      {!free ? (
        <>
          {signedIn && (missingProfile.phone || missingProfile.specialization) ? <div className="border-t border-line" /> : null}
          <BillingSection key={`${signedIn}`} profiles={billingProfiles} defaultName={defaultName} errors={e} />
        </>
      ) : null}

      {!free ? (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Metodă de plată</legend>
          <div className={`grid gap-3 ${methods.length > 1 ? "md:grid-cols-2" : ""}`}>
          {methods.map((m) => {
            const on = method === m;
            return (
              <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${on ? "border-gold bg-gold-soft" : "border-line hover:border-foreground/30"}`}>
                <input type="radio" name="payment_method" value={m} checked={on} onChange={() => setMethod(m)} className="mt-1 size-4 accent-[#a9833d]" />
                <span>
                  <span className="block font-medium">{m === "card" ? "Card bancar" : "Transfer bancar"}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {m === "card" ? "Plată securizată prin Stripe. Locul este confirmat imediat. Apple Pay și Google Pay apar pe dispozitivele care le suportă." : "Primești datele bancare după comandă. Înscrierea se activează după ce confirmăm plata."}
                  </span>
                </span>
              </label>
            );
          })}
          {method === "transfer" ? (
            <p className="rounded-xl bg-background px-4 py-3 text-sm leading-relaxed md:col-span-full">
              Locul tău se rezervă până <strong>{deadlineLabel}</strong>. Dacă plata nu ajunge până atunci, comanda se anulează automat, iar locul se eliberează.
            </p>
          ) : null}
          </div>
        </fieldset>
      ) : null}

      {state?.message ? (
        <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">
          {state.message}{" "}
          {state.message.includes("Există deja un cont") ? (
            <Link href={`/autentificare?next=${encodeURIComponent(next)}`} className="font-medium underline underline-offset-4">Intră în cont</Link>
          ) : null}
        </p>
      ) : null}

      <Button type="submit" variant="gold" disabled={pending || (!free && method === "card" && !enabled)} className="w-full">
        {pending ? "Se procesează..." : free ? "Confirmă înscrierea" : method === "transfer" ? "Plasează comanda" : totals && !totals.free ? `Plătește ${formatPrice(totals.total, totals.currency)}` : "Continuă către plată"}
      </Button>
      <ul className="grid gap-2 text-xs text-muted sm:grid-cols-2" aria-label="Garanții">
        <li className="flex items-center gap-2"><span aria-hidden="true" className="text-gold">✓</span> {method === "card" ? "Plată securizată prin Stripe" : "Locul se rezervă imediat"}</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="text-gold">✓</span> Factură fiscală după confirmarea plății</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="text-gold">✓</span> <Link href="/rambursare" className="underline underline-offset-4 hover:text-foreground">Politica de rambursare și transfer</Link></li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="text-gold">✓</span> Întrebări? <a href={contact.phoneHref} className="underline underline-offset-4 hover:text-foreground">{contact.phone}</a></li>
      </ul>
      <p className="text-center text-xs leading-relaxed text-muted">
        Prin plasarea comenzii accepți <Link href="/termeni" className="underline underline-offset-4 hover:text-foreground">Termenii și condițiile</Link>. Vezi{" "}
        <Link href="/confidentialitate" className="underline underline-offset-4 hover:text-foreground">Politica de confidențialitate</Link>.
      </p>
      {!enabled && !free && method === "card" ? <p className="text-center text-xs text-muted">Plata online va fi activată în curând.</p> : null}
    </form>
  );
}
