"use client";

import { useActionState } from "react";
import { requestTransfer } from "@/actions/transfers";
import { Button, Field } from "@/components/ui";

export function TransferForm({ enrollmentId }: { enrollmentId: string }) {
  const [state, action, pending] = useActionState(requestTransfer.bind(null, enrollmentId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="mt-5 space-y-4">
      <Field label="Emailul colegului (trebuie să aibă cont)" name="email" type="email" required error={e?.email?.[0]} />
      <Field label="Mesaj pentru organizator (opțional)" name="note" />
      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Se trimite..." : "Cere transferul"}</Button>
    </form>
  );
}
