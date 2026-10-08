"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import type { BillingProfile } from "@/lib/billing";

type Kind = "individual" | "company";
type Values = { name: string; cui: string; reg_com: string; address: string; city: string; county: string };

const empty = (name = ""): Values => ({ name, cui: "", reg_com: "", address: "", city: "", county: "" });
const fromProfile = (p: BillingProfile): Values => ({
  name: p.name,
  cui: p.cui ?? "",
  reg_com: p.reg_com ?? "",
  address: p.address,
  city: p.city,
  county: p.county,
});

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-line bg-background p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-full px-4 text-sm font-medium transition-all duration-300 ${
            value === o.value ? "bg-ink text-white shadow" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function BillingSection({
  profiles,
  defaultName,
  errors,
}: {
  profiles: BillingProfile[];
  defaultName: string;
  errors?: Record<string, string[]>;
}) {
  const hasSaved = profiles.length > 0;
  const [mode, setMode] = useState<"saved" | "new">(hasSaved ? "saved" : "new");
  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? "");
  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  const [kind, setKind] = useState<Kind>("individual");
  const [values, setValues] = useState<Values>(empty(defaultName));

  const isSaved = mode === "saved" && selected;
  const current: Values = isSaved ? fromProfile(selected) : values;
  const currentKind: Kind = isSaved ? selected.kind : kind;
  const readOnly = Boolean(isSaved);
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const err = (k: string) => errors?.[`billing_${k}`]?.[0];

  return (
    <fieldset className="space-y-5">
      <legend className="font-display text-2xl">Date de facturare</legend>

      {hasSaved ? (
        <Segmented
          label="Profil de facturare"
          value={mode}
          onChange={(m) => {
            setMode(m);
            if (m === "new") setValues(empty(defaultName));
          }}
          options={[
            { value: "saved", label: "Profil salvat" },
            { value: "new", label: "Profil nou" },
          ]}
        />
      ) : null}
      <input type="hidden" name="billing_mode" value={isSaved ? "saved" : "new"} />

      {isSaved && profiles.length > 1 ? (
        <div>
          <label htmlFor="billing_profile_id" className="mb-1.5 block text-sm font-medium">Alege profilul</label>
          <select
            id="billing_profile_id"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kind === "company" ? "Firmă" : "Persoană fizică"}: {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {isSaved ? <input type="hidden" name="billing_profile_id" value={selected.id} /> : null}

      <Segmented<Kind>
        label="Tip client"
        value={currentKind}
        onChange={(k) => !readOnly && setKind(k)}
        options={[
          { value: "individual", label: "Persoană fizică" },
          { value: "company", label: "Firmă" },
        ]}
      />
      <input type="hidden" name="billing_kind" value={currentKind} />
      {readOnly ? <p className="-mt-2 text-xs text-muted">Datele sunt din profilul salvat. Alege „Profil nou” pentru a introduce altele.</p> : null}

      <Field label={currentKind === "company" ? "Denumire firmă" : "Nume și prenume"} name="billing_name" autoComplete="organization" value={current.name} onChange={set("name")} readOnly={readOnly} required error={err("name")} />
      {currentKind === "company" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="CUI / CIF" name="billing_cui" placeholder="RO12345678" value={current.cui} onChange={set("cui")} readOnly={readOnly} required error={err("cui")} />
          <Field label="Nr. Reg. Com. (opțional)" name="billing_reg_com" placeholder="J40/123/2020" value={current.reg_com} onChange={set("reg_com")} readOnly={readOnly} error={err("reg_com")} />
        </div>
      ) : null}
      <Field label="Adresă" name="billing_address" autoComplete="street-address" value={current.address} onChange={set("address")} readOnly={readOnly} required error={err("address")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Localitate" name="billing_city" autoComplete="address-level2" value={current.city} onChange={set("city")} readOnly={readOnly} required error={err("city")} />
        <Field label="Județ / Sector" name="billing_county" autoComplete="address-level1" value={current.county} onChange={set("county")} readOnly={readOnly} required error={err("county")} />
      </div>

      {!isSaved ? (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="billing_save" defaultChecked className="mt-1 size-4 accent-[#a9833d]" />
          <span>Salvează acest profil pentru comenzile viitoare</span>
        </label>
      ) : null}
    </fieldset>
  );
}
