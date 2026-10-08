"use client";

import { useActionState } from "react";
import {
  adjustUserPoints,
  addUserNote,
  anonymizeUser,
  enrollUser,
  manualOrder,
  markOrderPaid,
  refundOrder,
  sendCampaign,
  setUserTier,
  updateUserProfile,
} from "@/actions/staff";
import { bulkCreateCodes, updateDiscountCode } from "@/actions/admin";
import { Button, Field } from "@/components/ui";
import type { FormState } from "@/actions/auth";

type Course = { id: string; title: string };
type Act = (state: FormState, formData: FormData) => Promise<FormState>;

const selectCls = "min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base";
const areaCls = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";

function Msg({ state }: { state: FormState }) {
  return state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null;
}

function Select({ label, name, options, error, placeholder }: { label: string; name: string; options: { value: string; label: string }[]; error?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">{label}</label>
      <select id={name} name={name} defaultValue="" className={selectCls}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function useAct(action: Act) {
  return useActionState(action, undefined);
}

export function ProfileEditForm({ userId, profile, canRole }: { userId: string; profile: { full_name: string | null; phone: string | null; specialization: string | null; role: string }; canRole: boolean }) {
  const [state, action, pending] = useAct(updateUserProfile.bind(null, userId));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Nume complet" name="full_name" defaultValue={profile.full_name ?? ""} required error={e?.full_name?.[0]} />
      <Field label="Telefon" name="phone" defaultValue={profile.phone ?? ""} error={e?.phone?.[0]} />
      <Field label="Specializare" name="specialization" defaultValue={profile.specialization ?? ""} error={e?.specialization?.[0]} />
      {canRole ? (
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium">Rol</label>
          <select id="role" name="role" defaultValue={profile.role === "instructor" ? "student" : profile.role} className={selectCls}>
            <option value="student">Cursant</option>
            <option value="operator">Operator (useri și comenzi)</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      ) : null}
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</Button></div>
    </form>
  );
}

export function NoteForm({ userId }: { userId: string }) {
  const [state, action, pending] = useAct(addUserNote.bind(null, userId));
  return (
    <form action={action} className="space-y-4" key={state?.message ?? "n"}>
      <textarea name="note" rows={3} required placeholder="Notă internă, vizibilă doar echipei" aria-label="Notă internă" className={areaCls} />
      {state?.errors?.note?.[0] ? <p className="text-sm text-red-700">{state.errors.note[0]}</p> : null}
      <Msg state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Adaugă notă"}</Button>
    </form>
  );
}

export function EnrollForm({ userId, courses }: { userId: string; courses: Course[] }) {
  const [state, action, pending] = useAct(enrollUser.bind(null, userId));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" key={state?.message ?? "n"}>
      <Select label="Curs" name="course_id" placeholder="Alege cursul" options={courses.map((c) => ({ value: c.id, label: c.title }))} error={e?.course_id?.[0]} />
      <Field label="Motiv (cadou, invitație, plată în altă formă)" name="reason" required error={e?.reason?.[0]} />
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Înscrie fără plată"}</Button></div>
    </form>
  );
}

export function ManualOrderForm({ userId, courses }: { userId: string; courses: Course[] }) {
  const [state, action, pending] = useAct(manualOrder.bind(null, userId));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" key={state?.message ?? "n"}>
      <Select label="Curs" name="course_id" placeholder="Alege cursul" options={courses.map((c) => ({ value: c.id, label: c.title }))} error={e?.course_id?.[0]} />
      <Field label="Sumă încasată (EUR)" name="amount" type="number" min="0" step="0.01" required error={e?.amount?.[0]} />
      <div className="sm:col-span-2"><Field label="Motiv (ex. transfer bancar, numerar, factură proformă)" name="reason" required error={e?.reason?.[0]} /></div>
      <p className="text-sm text-muted sm:col-span-2">Comanda apare ca plătită, acordă înscrierea, punctele și contează pentru nivel. Nu se emite plată Stripe.</p>
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Creează comanda plătită"}</Button></div>
    </form>
  );
}

export function TierForm({ userId }: { userId: string }) {
  const [state, action, pending] = useAct(setUserTier.bind(null, userId));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Select label="Nivel" name="tier" options={[{ value: "gold", label: "Gold" }, { value: "platinum", label: "Platinum" }, { value: "standard", label: "Standard (blochează la Standard)" }]} error={e?.tier?.[0]} />
      <Field label="Valabil până la (gol = nelimitat)" name="until" type="date" />
      <div className="sm:col-span-2"><Field label="Motiv" name="reason" required error={e?.reason?.[0]} /></div>
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Setează nivelul"}</Button></div>
    </form>
  );
}

export function PointsForm({ userId }: { userId: string }) {
  const [state, action, pending] = useAct(adjustUserPoints.bind(null, userId));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" key={state?.message ?? "n"}>
      <Field label="Puncte (negativ pentru retragere)" name="delta" type="number" step="1" required error={e?.delta?.[0]} />
      <Field label="Motiv" name="reason" required error={e?.reason?.[0]} />
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Aplică"}</Button></div>
    </form>
  );
}

export function AnonymizeForm({ userId }: { userId: string }) {
  const [state, action, pending] = useAct(anonymizeUser.bind(null, userId));
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">Șterge datele personale (nume, email, telefon, profiluri de facturare, notițe). Comenzile și facturile rămân, conform obligațiilor legale. Acțiunea nu se poate anula.</p>
      <Field label="Scrie ANONIMIZEAZĂ pentru confirmare" name="confirm" autoComplete="off" />
      <Msg state={state} />
      <Button type="submit" variant="ghost" className="text-red-700" disabled={pending}>{pending ? "Se procesează..." : "Anonimizează contul"}</Button>
    </form>
  );
}

export function RefundForm({ orderId, stripe }: { orderId: string; stripe: boolean }) {
  const [state, action, pending] = useAct(refundOrder.bind(null, orderId));
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">
        {stripe ? "Rambursează integral prin Stripe, " : "Marchează comanda rambursată (plata nu a fost prin Stripe, returnezi banii separat), "}
        retrage înscrierea, retrage punctele câștigate și returnează punctele folosite.
      </p>
      <Field label="Motiv" name="reason" required error={state?.errors?.reason?.[0]} />
      <Msg state={state} />
      <Button type="submit" variant="ghost" className="text-red-700" disabled={pending}>{pending ? "Se procesează..." : "Rambursează comanda"}</Button>
    </form>
  );
}

export function MarkPaidForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useAct(markOrderPaid.bind(null, orderId));
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted">Folosește asta dacă banii au intrat în afara Stripe. Acordă înscrierea și punctele.</p>
      <Field label="Motiv" name="reason" required error={state?.errors?.reason?.[0]} />
      <Msg state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Se procesează..." : "Marchează plătită"}</Button>
    </form>
  );
}

export function CampaignForm({ courses }: { courses: Course[] }) {
  const [state, action, pending] = useAct(sendCampaign);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="audience" className="mb-1.5 block text-sm font-medium">Destinatari</label>
          <select id="audience" name="audience" defaultValue="all" className={selectCls}>
            <option value="all">Toți utilizatorii</option>
            <option value="standard">Nivel Standard</option>
            <option value="gold">Nivel Gold</option>
            <option value="platinum">Nivel Platinum</option>
            <option value="enrolled">Înscriși la un curs</option>
            <option value="not_enrolled">Neînscriși la un curs</option>
          </select>
        </div>
        <Select label="Curs (pentru ultimele două)" name="course_id" placeholder="Alege cursul" options={courses.map((c) => ({ value: c.id, label: c.title }))} error={e?.course_id?.[0]} />
      </div>
      <Field label="Subiect" name="subject" required error={e?.subject?.[0]} />
      <div>
        <label htmlFor="body" className="mb-1.5 block text-sm font-medium">Mesaj (paragrafele se separă printr-un rând gol)</label>
        <textarea id="body" name="body" rows={8} required className={areaCls} />
        {e?.body?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.body[0]}</p> : null}
      </div>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="confirm" className="mt-1 size-4 accent-[#a9833d]" /> Confirm trimiterea către toți destinatarii segmentului (maximum 500 per trimitere).</label>
      <Msg state={state} />
      <Button type="submit" variant="gold" disabled={pending}>{pending ? "Se trimite..." : "Trimite emailul"}</Button>
    </form>
  );
}

type CodeRow = { id: string; kind: string; value: number; course_id: string | null; max_uses: number | null; starts_at: string | null; expires_at: string | null; note: string | null };
const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(iso)) : "");

export function CodeEditForm({ code, courses }: { code: CodeRow; courses: Course[] }) {
  const [state, action, pending] = useAct(updateDiscountCode.bind(null, code.id));
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="kind" className="mb-1.5 block text-sm font-medium">Tip</label>
        <select id="kind" name="kind" defaultValue={code.kind} className={selectCls}>
          <option value="percent">Procent (%)</option>
          <option value="amount">Sumă fixă (în moneda cursului)</option>
        </select>
      </div>
      <Field label="Valoare" name="value" type="number" step="0.01" min="0" defaultValue={code.kind === "percent" ? code.value : code.value / 100} required error={e?.value?.[0]} />
      <div>
        <label htmlFor="course_id" className="mb-1.5 block text-sm font-medium">Valabil pentru</label>
        <select id="course_id" name="course_id" defaultValue={code.course_id ?? ""} className={selectCls}>
          <option value="">Toate cursurile</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <Field label="Număr maxim de utilizări" name="max_uses" type="number" min="1" defaultValue={code.max_uses ?? ""} />
      <Field label="Începe la (programare)" name="starts_on" type="date" defaultValue={day(code.starts_at)} />
      <Field label="Expiră la" name="expires_on" type="date" defaultValue={day(code.expires_at)} error={e?.expires_on?.[0]} />
      <div className="sm:col-span-2"><Field label="Notă internă" name="note" defaultValue={code.note ?? ""} /></div>
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</Button></div>
    </form>
  );
}

export function BulkCodesForm({ courses }: { courses: Course[] }) {
  const [state, action, pending] = useAct(bulkCreateCodes);
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Prefix (ex. CONGRES)" name="prefix" required error={e?.prefix?.[0]} />
      <Field label="Număr de coduri (maximum 200)" name="count" type="number" min="1" max="200" required error={e?.count?.[0]} />
      <div>
        <label htmlFor="bulk_kind" className="mb-1.5 block text-sm font-medium">Tip</label>
        <select id="bulk_kind" name="kind" className={selectCls}>
          <option value="percent">Procent (%)</option>
          <option value="amount">Sumă fixă</option>
        </select>
      </div>
      <Field label="Valoare" name="value" type="number" step="0.01" min="0" required error={e?.value?.[0]} />
      <Select label="Valabil pentru" name="course_id" placeholder="Toate cursurile" options={courses.map((c) => ({ value: c.id, label: c.title }))} />
      <Field label="Campanie (etichetă)" name="campaign" />
      <Field label="Începe la" name="starts_on" type="date" />
      <Field label="Expiră la" name="expires_on" type="date" />
      <div className="space-y-4 sm:col-span-2"><Msg state={state} /><Button type="submit" disabled={pending}>{pending ? "Se generează..." : "Generează codurile"}</Button></div>
    </form>
  );
}
