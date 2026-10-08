"use client";

import { useActionState } from "react";
import { addEvent, savePost, saveTrainer } from "@/actions/content";
import { Button, Field } from "@/components/ui";
import { toBucharestLocal } from "@/lib/format";
import type { BlogPost, Trainer } from "@/lib/types";

const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";
const fileCls = "block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white";

function Status({ message }: { message?: string }) {
  return message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null;
}

export function TrainerForm({ trainer }: { trainer: Trainer }) {
  const [state, action, pending] = useActionState(saveTrainer.bind(null, trainer.id), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Nume" name="name" defaultValue={trainer.name} required error={e?.name?.[0]} />
      <div><label htmlFor={`role-${trainer.id}`} className="mb-1.5 block text-sm font-medium">Titulatură</label><textarea id={`role-${trainer.id}`} name="role" rows={2} defaultValue={trainer.role ?? ""} className={area} /></div>
      <div><label htmlFor={`bio-${trainer.id}`} className="mb-1.5 block text-sm font-medium">Biografie</label><textarea id={`bio-${trainer.id}`} name="bio" rows={4} defaultValue={trainer.bio ?? ""} className={area} /></div>
      <div><label htmlFor={`pts-${trainer.id}`} className="mb-1.5 block text-sm font-medium">Puncte cheie (unul pe rând)</label><textarea id={`pts-${trainer.id}`} name="points" rows={3} defaultValue={trainer.points.join("\n")} className={area} /></div>
      <Field label="Video de prezentare (link https, YouTube/Vimeo/mp4)" name="intro_video_url" type="url" defaultValue={trainer.intro_video_url ?? ""} error={e?.intro_video_url?.[0]} />
      <div><label htmlFor={`ph-${trainer.id}`} className="mb-1.5 block text-sm font-medium">Fotografie (JPG, PNG, WebP, maximum 6 MB)</label><input id={`ph-${trainer.id}`} type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/avif" className={fileCls} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={trainer.published} className="size-4 accent-[#a9833d]" /> Afișat pe site</label>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</Button>
    </form>
  );
}

export function PostForm({ post }: { post?: BlogPost }) {
  const [state, action, pending] = useActionState(savePost.bind(null, post?.id ?? null), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Titlu" name="title" defaultValue={post?.title} required error={e?.title?.[0]} />
      <Field label="Slug (opțional)" name="slug" defaultValue={post?.slug} />
      <Field label="Autor" name="author_name" defaultValue={post?.author_name ?? "Echipa Dental Masters Academy"} />
      <div><label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium">Rezumat (apare în listă și în Google)</label><textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={area} /></div>
      <div>
        <label htmlFor="body" className="mb-1.5 block text-sm font-medium">Text (paragrafe separate printr-un rând gol; un rând scurt fără punct la final devine subtitlu)</label>
        <textarea id="body" name="body" rows={16} defaultValue={post?.body ?? ""} required className={area} />
        {e?.body?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.body[0]}</p> : null}
      </div>
      <div><label htmlFor="cover" className="mb-1.5 block text-sm font-medium">Imagine (opțional)</label><input id="cover" type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/avif" className={fileCls} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={post?.published} className="size-4 accent-[#a9833d]" /> Publicat (vizibil pe site)</label>
      <Field label="Programează publicarea (opțional, ora României). Gol = vizibil imediat" name="publish_at" type="datetime-local" defaultValue={toBucharestLocal(post?.published_at)} />
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează articolul"}</Button>
    </form>
  );
}

export function EventForm() {
  const [state, action, pending] = useActionState(addEvent, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Titlu (ex. Dark Side of Implantology, ediția martie 2026)" name="title" required error={e?.title?.[0]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Data" name="event_date" type="date" required error={e?.event_date?.[0]} />
        <Field label="Număr participanți (opțional)" name="participants" type="number" min="0" />
      </div>
      <Field label="Locație (opțional)" name="location" />
      <div><label htmlFor="ev_desc" className="mb-1.5 block text-sm font-medium">Descriere (opțional)</label><textarea id="ev_desc" name="description" rows={3} className={area} /></div>
      <div><label htmlFor="ev_photos" className="mb-1.5 block text-sm font-medium">Fotografii (mai multe, maximum 6 MB fiecare)</label><input id="ev_photos" type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp,image/avif" className={fileCls} /></div>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se încarcă..." : "Adaugă evenimentul"}</Button>
    </form>
  );
}
