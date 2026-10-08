"use client";

import { useActionState } from "react";
import { addLesson, addTestimonial, deleteCourse, saveCourse, saveLoyalty } from "@/actions/admin";
import { Button, Field } from "@/components/ui";
import type { Category, Course, LoyaltySettings } from "@/lib/types";

const area =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";

function Status({ message }: { message?: string }) {
  return message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null;
}

export function CourseForm({ course, categories }: { course?: Course; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveCourse.bind(null, course?.id ?? null), undefined);
  const e = state?.errors;
  const fmtDay = (iso: string | null | undefined) =>
    iso ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(iso)) : "";
  const date = fmtDay(course?.starts_at);
  const endDate = fmtDay(course?.ends_at);
  const sectionsText = (course?.sections ?? []).map((s) => [s.title, ...s.items.map((i) => `- ${i}`)].join("\n")).join("\n\n");

  return (
    <form action={action} className="space-y-5">
      <Field label="Titlu" name="title" defaultValue={course?.title} required error={e?.title?.[0]} />
      <Field label="Slug (opțional, se generează din titlu)" name="slug" defaultValue={course?.slug} error={e?.slug?.[0]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category_id" className="mb-1.5 block text-sm font-medium">Specializare</label>
          <select id="category_id" name="category_id" defaultValue={course?.category_id ?? ""} className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
            <option value="">Fără specializare</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="format" className="mb-1.5 block text-sm font-medium">Format</label>
          <select id="format" name="format" defaultValue={course?.format ?? "physical"} className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
            <option value="physical">Fizic</option>
            <option value="online">Online</option>
            <option value="hybrid">Hibrid</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="summary" className="mb-1.5 block text-sm font-medium">Rezumat</label>
        <textarea id="summary" name="summary" rows={2} defaultValue={course?.summary ?? ""} className={area} />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Descriere</label>
        <textarea id="description" name="description" rows={6} defaultValue={course?.description ?? ""} className={area} />
      </div>
      <div>
        <label htmlFor="outcomes" className="mb-1.5 block text-sm font-medium">Ce vei învăța (câte un punct pe rând)</label>
        <textarea id="outcomes" name="outcomes" rows={5} defaultValue={(course?.outcomes ?? []).join("\n")} className={area} />
      </div>
      <div>
        <label htmlFor="audience" className="mb-1.5 block text-sm font-medium">Pentru cine este (câte un punct pe rând)</label>
        <textarea id="audience" name="audience" rows={4} defaultValue={(course?.audience ?? []).join("\n")} className={area} />
      </div>
      <div>
        <label htmlFor="sections" className="mb-1.5 block text-sm font-medium">Programa structurată (titlu pe primul rând, puncte cu „-”, blocuri separate printr-un rând gol)</label>
        <textarea id="sections" name="sections" rows={8} defaultValue={sectionsText} className={area} />
      </div>
      <div>
        <label htmlFor="syllabus" className="mb-1.5 block text-sm font-medium">Programa</label>
        <textarea id="syllabus" name="syllabus" rows={6} defaultValue={course?.syllabus ?? ""} className={area} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Formator" name="trainer_name" defaultValue={course?.trainer_name ?? ""} />
        <Field label="Data de început" name="starts_on" type="date" defaultValue={date} />
        <Field label="Data de final (opțional)" name="ends_on" type="date" defaultValue={endDate} />
        <Field label="Limba" name="language" defaultValue={course?.language ?? ""} />
        <Field label="Locație" name="location" defaultValue={course?.location ?? ""} />
        <Field label="Preț" name="price" type="number" step="0.01" min="0" defaultValue={course ? course.price_cents / 100 : ""} required error={e?.price?.[0]} />
        <Field label="Preț vechi, tăiat (opțional)" name="old_price" type="number" step="0.01" min="0" defaultValue={course?.old_price_cents ? course.old_price_cents / 100 : ""} />
        <div>
          <label htmlFor="currency" className="mb-1.5 block text-sm font-medium">Moneda</label>
          <select id="currency" name="currency" defaultValue={(course?.currency ?? "RON").trim()} className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <Field label="Locuri (opțional)" name="capacity" type="number" min="1" defaultValue={course?.capacity ?? ""} />
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={course?.status ?? "draft"} className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
            <option value="draft">Ciornă (nepublicat)</option>
            <option value="published">Publicat</option>
            <option value="archived">Arhivat</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={course?.is_featured} className="size-4 accent-[#a9833d]" /> Recomandat pe prima pagină</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="gold_free" defaultChecked={course?.gold_free} className="size-4 accent-[#a9833d]" /> Acces gratuit pentru membrii Gold</label>
      </div>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează cursul"}</Button>
    </form>
  );
}

export function DeleteCourseButton({ id }: { id: string }) {
  return (
    <form action={deleteCourse.bind(null, id)}>
      <Button type="submit" variant="ghost" className="text-red-700" onClick={(ev) => { if (!confirm("Ștergi cursul? Dacă are comenzi, va fi arhivat.")) ev.preventDefault(); }}>
        Șterge cursul
      </Button>
    </form>
  );
}

export function TestimonialForm() {
  const [state, action, pending] = useActionState(addTestimonial, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Nume" name="author_name" required error={e?.author_name?.[0]} />
      <Field label="Titulatură (ex. Medic stomatolog, București)" name="author_title" />
      <div>
        <label htmlFor="quote" className="mb-1.5 block text-sm font-medium">Testimonial</label>
        <textarea id="quote" name="quote" rows={4} required className={area} />
        {e?.quote?.[0] ? <p className="mt-1.5 text-sm text-red-700">{e.quote[0]}</p> : null}
      </div>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Adaugă testimonial"}</Button>
    </form>
  );
}

export function LoyaltyForm({ settings }: { settings: LoyaltySettings }) {
  const [state, action, pending] = useActionState(saveLoyalty, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={settings.is_active} className="size-4 accent-[#a9833d]" /> Program Gold activ</label>
      <p className="text-sm text-muted">Un medic devine Gold dacă îndeplinește oricare dintre praguri. Lasă gol sau 0 pentru a dezactiva un prag.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prag valoare achiziții (în moneda cursurilor)" name="spend_ron" type="number" min="0" step="1" defaultValue={settings.spend_threshold_cents ? settings.spend_threshold_cents / 100 : ""} error={e?.spend_ron?.[0]} />
        <Field label="Prag număr cursuri" name="courses_threshold" type="number" min="0" defaultValue={settings.courses_threshold ?? ""} error={e?.courses_threshold?.[0]} />
        <Field label="Perioadă de calcul (zile, gol = tot istoricul)" name="window_days" type="number" min="0" defaultValue={settings.window_days ?? ""} error={e?.window_days?.[0]} />
        <Field label="Reducere Gold (%)" name="gold_discount_percent" type="number" min="0" max="100" step="0.5" defaultValue={Number(settings.gold_discount_percent)} required error={e?.gold_discount_percent?.[0]} />
      </div>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează setările"}</Button>
    </form>
  );
}

export function LessonForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(addLesson.bind(null, courseId), undefined);
  const e = state?.errors;
  return (
    <form action={action} className="space-y-5">
      <Field label="Titlul lecției" name="title" required error={e?.title?.[0]} />
      <Field label="Link video (YouTube, Vimeo sau fișier .mp4, https)" name="video_url" type="url" error={e?.video_url?.[0]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Durată (minute)" name="duration_min" type="number" min="0" error={e?.duration_min?.[0]} />
      </div>
      <div>
        <label htmlFor="lesson_description" className="mb-1.5 block text-sm font-medium">Descriere (opțional)</label>
        <textarea id="lesson_description" name="description" rows={3} className={area} />
      </div>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Adaugă lecția"}</Button>
    </form>
  );
}
