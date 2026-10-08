"use client";

import { useActionState, useState } from "react";
import { addBillingProfile } from "@/actions/account";
import { Button, Field } from "@/components/ui";

export function BillingProfileForm() {
  const [state, action, pending] = useActionState(addBillingProfile, undefined);
  const [kind, setKind] = useState<"individual" | "company">("individual");
  const e = state?.errors;
  const err = (k: string) => e?.[`billing_${k}`]?.[0];
  return (
    <form action={action} key={state?.message === "Profilul de facturare a fost adăugat." ? "done" : "form"} className="space-y-5">
      <input type="hidden" name="billing_kind" value={kind} />
      <div role="radiogroup" aria-label="Tip client" className="grid max-w-md auto-cols-fr grid-flow-col gap-1 rounded-full border border-line bg-background p-1">
        {([["individual", "Persoană fizică"], ["company", "Firmă"]] as const).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={kind === v} onClick={() => setKind(v)}
            className={`min-h-11 rounded-full px-4 text-sm font-medium transition-all ${kind === v ? "bg-ink text-white shadow" : "text-muted hover:text-foreground"}`}>{l}</button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={kind === "company" ? "Denumire firmă" : "Nume și prenume"} name="billing_name" required error={err("name")} />
        {kind === "company" ? <Field label="CUI / CIF" name="billing_cui" placeholder="RO12345678" required error={err("cui")} /> : null}
        {kind === "company" ? <Field label="Nr. Reg. Com. (opțional)" name="billing_reg_com" placeholder="J40/123/2020" error={err("reg_com")} /> : null}
        <Field label="Adresă" name="billing_address" required error={err("address")} />
        <Field label="Localitate" name="billing_city" required error={err("city")} />
        <Field label="Județ / Sector" name="billing_county" required error={err("county")} />
      </div>
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Adaugă profil"}</Button>
    </form>
  );
}
