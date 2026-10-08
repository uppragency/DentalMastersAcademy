"use client";

import { useActionState } from "react";
import { addMaterial, announceToEnrolled } from "@/actions/engagement";
import { submitFeedback } from "@/actions/ops";
import { Button, Field } from "@/components/ui";

const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";
const Status = ({ message }: { message?: string }) => (message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null);

export function MaterialForm({ courseId, slug }: { courseId: string; slug: string }) {
  const [state, action, pending] = useActionState(addMaterial.bind(null, courseId, slug), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-4">
      <Field label="Titlu material" name="title" required error={e?.title?.[0]} />
      <div>
        <label htmlFor="mat_file" className="mb-1.5 block text-sm font-medium">Fișier (PDF, imagine, arhivă; maximum 4 MB, vizibil 12 luni după curs)</label>
        <input id="mat_file" type="file" name="file" className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white" />
      </div>
      <Field label="sau link (https, pentru fișiere mari: Drive, Dropbox)" name="url" type="url" error={e?.url?.[0]} />
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

export function FeedbackForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(submitFeedback.bind(null, courseId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Cum evaluezi cursul?</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} required className="peer sr-only" />
              <span className="flex size-12 items-center justify-center rounded-full border border-line text-base font-medium transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{n}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">1 = slab, 5 = excelent</p>
        {e?.rating?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.rating[0]}</p> : null}
      </fieldset>
      <div>
        <label htmlFor="comment" className="mb-1.5 block text-sm font-medium">Ce a fost bun și ce putem îmbunătăți? (opțional)</label>
        <textarea id="comment" name="comment" rows={4} className={area} />
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="allow_public" className="mt-1 size-4 accent-[#a9833d]" /> Sunt de acord ca acest comentariu să fie publicat pe site ca recenzie, după aprobarea echipei (minimum 20 de caractere).</label>
      <Status message={state?.message} />
      <Button type="submit" variant="gold" disabled={pending}>{pending ? "Se trimite..." : "Trimite evaluarea"}</Button>
    </form>
  );
}
