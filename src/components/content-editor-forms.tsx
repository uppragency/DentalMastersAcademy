"use client";

import { useActionState } from "react";
import { saveBank, saveFaqs, saveLegal, savePartners } from "@/actions/ops";
import { Button } from "@/components/ui";
import type { FormState } from "@/actions/auth";

type Act = (state: FormState, formData: FormData) => Promise<FormState>;
const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";

function TextForm({ action, name, label, rows, defaultValue, hint }: { action: Act; name: string; label: string; rows: number; defaultValue: string; hint?: string }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className="space-y-4">
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      <textarea id={name} name={name} rows={rows} defaultValue={defaultValue} className={area} />
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</Button>
    </form>
  );
}

export const FaqEditor = ({ value }: { value: string }) => (
  <TextForm action={saveFaqs} name="faqs" label="Întrebări frecvente (pagina principală)" rows={14} defaultValue={value} hint="Întrebarea pe primul rând, răspunsul pe următoarele, blocuri separate printr-un rând gol. Gol = întrebările implicite." />
);
export const PartnersEditor = ({ value }: { value: string }) => (
  <TextForm action={savePartners} name="partners" label="Parteneri și materiale folosite" rows={6} defaultValue={value} hint="Un nume pe rând. Adaugă doar mărci cu acord scris. Gol = secțiune ascunsă." />
);
export const BankEditor = ({ value }: { value: string }) => (
  <TextForm action={saveBank} name="bank" label="Date bancare pentru transfer" rows={6} defaultValue={value} hint="Beneficiar, IBAN, bancă, CUI. Un rând per informație. Nu este public: apare doar în emailul de instrucțiuni de plată." />
);

export function LegalEditor({ k, label, value }: { k: "legal_termeni" | "legal_confidentialitate" | "legal_cookies" | "legal_rambursare"; label: string; value: string }) {
  return <TextForm action={saveLegal.bind(null, k)} name="text" label={label} rows={16} defaultValue={value} hint='Titluri: rând care începe cu "## ". Paragrafe separate printr-un rând gol. Gol = pagina revine la varianta implicită.' />;
}
