"use client";

import { useActionState } from "react";
import { addMaterial, announceToEnrolled, submitReview } from "@/actions/engagement";
import { Button, Field } from "@/components/ui";

const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";
const Status = ({ message }: { message?: string }) => (message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null);

export function MaterialForm({ courseId, slug }: { courseId: string; slug: string }) {
  const [state, action, pending] = useActionState(addMaterial.bind(null, courseId, slug), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <Field label="Titlu material" name="title" required error={e?.title?.[0]} />
      <Field label="Link (https, Drive, Dropbox sau fișier găzduit)" name="url" type="url" required error={e?.url?.[0]} />
      <Field label="Descriere (opțional)" name="description" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[#a9833d]" /> Notifică cursanții în cont</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="email" className="size-4 accent-[#a9833d]" /> Trimite și email</label>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Adaugă materialul"}</Button>
    </form>
  );
}

export function AnnounceForm({ courseId, slug }: { courseId: string; slug: string }) {
  const [state, action, pending] = useActionState(announceToEnrolled.bind(null, courseId, slug), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <Field label="Titlu" name="title" required error={e?.title?.[0]} />
      <div>
        <label htmlFor="ann_body" className="mb-1.5 block text-sm font-medium">Mesaj</label>
        <textarea id="ann_body" name="body" rows={3} required className={area} />
        {e?.body?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.body[0]}</p> : null}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="email" defaultChecked className="size-4 accent-[#a9833d]" /> Trimite și email</label>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se trimite..." : "Trimite anunțul"}</Button>
    </form>
  );
}

export function ReviewForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(submitReview.bind(null, courseId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="quote" className="mb-1.5 block text-sm font-medium">Cum a fost cursul pentru tine?</label>
        <textarea id="quote" name="quote" rows={4} required className={area} />
        {e?.quote?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.quote[0]}</p> : null}
      </div>
      <Status message={state?.message} />
      <Button type="submit" variant="gold" disabled={pending}>{pending ? "Se trimite..." : "Trimite recenzia"}</Button>
    </form>
  );
}
