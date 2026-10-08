"use client";

import { useActionState } from "react";
import { addLesson, addTestimonial, createDiscountCode, deleteCourse, saveCourse, saveLoyalty, adjustPoints } from "@/actions/admin";
import { Button, Field } from "@/components/ui";
import { toBucharestLocal } from "@/lib/format";
import type { Category, Course, LoyaltySettings } from "@/lib/types";

const area =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition-colors focus:border-gold";

function Status({ message }: { message?: string }) {
  return message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{message}</p> : null;
}

export function CourseForm({ course, categories, otherCourses = [] }: { course?: Course; categories: Category[]; otherCourses?: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(saveCourse.bind(null, course?.id ?? null), undefined);
  const e = state?.errors;
  const fmtDay = (iso: string | null | undefined) =>
    iso ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(new Date(iso)) : "";
  const date = fmtDay(course?.starts_at);
  const endDate = fmtDay(course?.ends_at);
  const fmtTime = (iso: string | null | undefined, fallback: string) =>
    iso ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : fallback;
  const scheduleText = (course?.schedule ?? []).map((d) => [d.title, ...d.items.map((i) => (i.time ? `${i.time} ${i.text}` : i.text))].join("\n")).join("\n\n");
  const opensOn = fmtDay(course?.registration_opens_at);
  const faqsText = (course?.faqs ?? []).map((f) => `${f.q}\n${f.a}`).join("\n\n");
  const sectionsText = (course?.sections ?? []).map((s) => [s.title, ...s.items.map((i) => `- ${i}`)].join("\n")).join("\n\n");

  return (
    <form action={action} className="space-y-5">
      <Field label="Titlu" name="title" defaultValue={course?.title} required error={e?.title?.[0]} />
      <div className="grid gap-5 sm:grid-cols-2">
        {([
          { name: "cover", label: "Imagine cover (pagina cursului, pe toată lățimea)", hint: "Recomandat 1920 × 800 px, orizontal, JPG sau WebP, maximum 2 MB. Subiectul în partea dreaptă, textul stă pe stânga.", url: course?.cover_url },
          { name: "thumbnail", label: "Imagine thumbnail (grilele de cursuri)", hint: "Recomandat 800 × 600 px (4:3), JPG sau WebP, maximum 2 MB.", url: course?.thumbnail_url },
        ] as const).map((f) => (
          <div key={f.name} className="rounded-2xl border border-line p-4">
            <label htmlFor={f.name} className="mb-1.5 block text-sm font-medium">{f.label}</label>
            {f.url ? (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" className={`w-full rounded-xl object-cover ${f.name === "cover" ? "aspect-[12/5]" : "aspect-[4/3]"}`} />
                <label className="mt-2 flex items-center gap-2 text-xs text-muted"><input type="checkbox" name={`remove_${f.name}`} className="size-4" /> Șterge imaginea curentă</label>
              </div>
            ) : null}
            <input id={f.name} type="file" name={f.name} accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white" />
            <p className="mt-2 text-xs text-muted">{f.hint}</p>
          </div>
        ))}
      </div>
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
        <label htmlFor="schedule" className="mb-1.5 block text-sm font-medium">Programul pe zile, pentru cursurile fizice (titlul zilei pe primul rând, apoi „09:00 Activitate”, câte una pe rând, zilele separate printr-un rând gol)</label>
        <textarea id="schedule" name="schedule" rows={8} defaultValue={scheduleText} placeholder={"Ziua 1, 22 mai\n09:00 Înregistrare și cafea\n09:30 Prezentare teoretică\n13:00 Pauză de masă"} className={area} />
      </div>
      <div>
        <label htmlFor="faqs" className="mb-1.5 block text-sm font-medium">Întrebări frecvente (întrebarea pe primul rând, răspunsul pe următoarele, blocuri separate printr-un rând gol)</label>
        <textarea id="faqs" name="faqs" rows={6} defaultValue={faqsText} className={area} />
      </div>
      <div>
        <label htmlFor="syllabus" className="mb-1.5 block text-sm font-medium">Programa</label>
        <textarea id="syllabus" name="syllabus" rows={6} defaultValue={course?.syllabus ?? ""} className={area} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Formator" name="trainer_name" defaultValue={course?.trainer_name ?? ""} />
        <Field label="Data de început" name="starts_on" type="date" defaultValue={date} />
        <Field label="Ora de început" name="start_time" type="time" defaultValue={fmtTime(course?.starts_at, "09:00")} />
        <Field label="Data de final (opțional)" name="ends_on" type="date" defaultValue={endDate} />
        <Field label="Ora de final" name="end_time" type="time" defaultValue={fmtTime(course?.ends_at, "18:00")} />
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
        <Field label="Înscrierile se deschid la (opțional, număr invers)" name="opens_on" type="date" defaultValue={opensOn} />
        <Field label="Programează publicarea (opțional, ora României). Gol = vizibil imediat ce statusul este Publicat" name="publish_at" type="datetime-local" defaultValue={toBucharestLocal(course?.publish_at)} />
        <Field label="Video de prezentare (link https, YouTube/Vimeo/mp4)" name="promo_video_url" type="url" defaultValue={course?.promo_video_url ?? ""} error={e?.promo_video_url?.[0]} />
        <div>
          <label htmlFor="next_edition_of" className="mb-1.5 block text-sm font-medium">Ediție nouă a cursului (anunță lista de așteptare)</label>
          <select id="next_edition_of" name="next_edition_of" defaultValue={course?.next_edition_of ?? ""} className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
            <option value="">Nu este ediție nouă</option>
            {otherCourses.filter((c) => c.id !== course?.id).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <Field label="Parcare și acces (apare în remindere)" name="parking_info" defaultValue={course?.parking_info ?? ""} />
        <Field label="Ce să aducă participanții (apare în remindere)" name="bring_info" defaultValue={course?.bring_info ?? ""} />
        <Field label="Locuri (opțional)" name="capacity" type="number" min="1" defaultValue={course?.capacity ?? ""} />
        <Field label="Durată în ore (apare în portofoliul cursantului)" name="duration_hours" type="number" min="0.5" step="0.5" defaultValue={course?.duration_hours ?? ""} />
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
  const n = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : Number(v));
  const money = (v: number | null) => (v ? v / 100 : "");
  return (
    <form action={action} className="space-y-6">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={settings.is_active} className="size-4 accent-[#a9833d]" /> Program activ (niveluri și puncte)</label>
      <p className="text-sm text-muted">Valorile în bani sunt în moneda cursurilor (EUR). Un prag gol sau 0 este dezactivat. Statusul se obține dacă îndeplinești oricare prag, în perioada de calcul.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Perioadă de calcul (zile, gol = tot istoricul)" name="window_days" type="number" min="0" defaultValue={n(settings.window_days)} error={e?.window_days?.[0]} />
        <Field label="Perioadă de grație la retrogradare (zile)" name="tier_grace_days" type="number" min="0" defaultValue={n(settings.tier_grace_days)} required error={e?.tier_grace_days?.[0]} />
      </div>
      <fieldset className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <legend className="mb-3 font-semibold">Gold</legend>
        <Field label="Prag achiziții (EUR)" name="spend_ron" type="number" min="0" step="1" defaultValue={money(settings.spend_threshold_cents)} error={e?.spend_ron?.[0]} />
        <Field label="Prag număr cursuri" name="courses_threshold" type="number" min="0" defaultValue={n(settings.courses_threshold)} error={e?.courses_threshold?.[0]} />
        <Field label="Reducere automată (%)" name="gold_discount_percent" type="number" min="0" max="100" step="0.5" defaultValue={n(settings.gold_discount_percent)} required error={e?.gold_discount_percent?.[0]} />
        <Field label="Multiplicator puncte" name="points_multiplier_gold" type="number" min="0" step="0.1" defaultValue={n(settings.points_multiplier_gold)} required error={e?.points_multiplier_gold?.[0]} />
        <Field label="Plafon plată cu puncte (% din preț)" name="points_cap_gold" type="number" min="0" max="100" step="1" defaultValue={n(settings.points_cap_gold)} required error={e?.points_cap_gold?.[0]} />
      </fieldset>
      <fieldset className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <legend className="mb-3 font-semibold">Platinum</legend>
        <Field label="Prag achiziții (EUR)" name="platinum_spend" type="number" min="0" step="1" defaultValue={money(settings.platinum_spend_threshold_cents)} error={e?.platinum_spend?.[0]} />
        <Field label="Prag număr cursuri" name="platinum_courses" type="number" min="0" defaultValue={n(settings.platinum_courses_threshold)} error={e?.platinum_courses?.[0]} />
        <Field label="Reducere automată (%)" name="platinum_discount_percent" type="number" min="0" max="100" step="0.5" defaultValue={n(settings.platinum_discount_percent)} required error={e?.platinum_discount_percent?.[0]} />
        <Field label="Multiplicator puncte" name="points_multiplier_platinum" type="number" min="0" step="0.1" defaultValue={n(settings.points_multiplier_platinum)} required error={e?.points_multiplier_platinum?.[0]} />
        <Field label="Plafon plată cu puncte (% din preț)" name="points_cap_platinum" type="number" min="0" max="100" step="1" defaultValue={n(settings.points_cap_platinum)} required error={e?.points_cap_platinum?.[0]} />
      </fieldset>
      <fieldset className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <legend className="mb-3 font-semibold">Standard și puncte</legend>
        <Field label="Multiplicator puncte Standard" name="points_multiplier_standard" type="number" min="0" step="0.1" defaultValue={n(settings.points_multiplier_standard)} required error={e?.points_multiplier_standard?.[0]} />
        <Field label="Plafon plată cu puncte Standard (%)" name="points_cap_standard" type="number" min="0" max="100" step="1" defaultValue={n(settings.points_cap_standard)} required error={e?.points_cap_standard?.[0]} />
        <Field label="Valoarea unui punct (în cenți)" name="point_value_cents" type="number" min="0.01" step="0.01" defaultValue={n(settings.point_value_cents)} required error={e?.point_value_cents?.[0]} />
        <Field label="Valabilitatea punctelor (luni)" name="points_expiry_months" type="number" min="1" defaultValue={n(settings.points_expiry_months)} required error={e?.points_expiry_months?.[0]} />
        <Field label="Înscriere anticipată Gold și Platinum (ore)" name="early_access_hours" type="number" min="0" defaultValue={n(settings.early_access_hours)} required error={e?.early_access_hours?.[0]} />
      </fieldset>
      <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <Field label="Recomandare: reducere pentru colegul invitat (%)" name="referral_friend_percent" type="number" min="0" max="100" step="0.5" defaultValue={n(settings.referral_friend_percent)} required />
        <Field label="Recomandare: recompensă pentru cel care recomandă (%)" name="referral_reward_percent" type="number" min="0" max="100" step="0.5" defaultValue={n(settings.referral_reward_percent)} required />
      </div>
      <p className="text-sm text-muted">Reducerile nu se cumulează: se aplică cea mai mare dintre nivel, cod și recomandare. Punctele se pot folosi peste orice reducere, în limita plafonului.</p>
      <Status message={state?.message} />
      <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Salvează setările"}</Button>
    </form>
  );
}

export function AdjustPointsForm() {
  const [state, action, pending] = useActionState(adjustPoints, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Email cont" name="email" type="email" required error={e?.email?.[0]} />
      <Field label="Puncte (negativ pentru retragere)" name="delta" type="number" step="1" required error={e?.delta?.[0]} />
      <div className="sm:col-span-2"><Field label="Motiv" name="note" required error={e?.note?.[0]} /></div>
      <div className="sm:col-span-2 space-y-4">
        <Status message={state?.message} />
        <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Aplică ajustarea"}</Button>
      </div>
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
        <Field label="Capitol (ex. Modulul 1, lecțiile din același capitol se grupează)" name="chapter" />
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

export function DiscountCodeForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createDiscountCode, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Cod (ex. PRIMAVARA10)" name="code" required error={e?.code?.[0]} />
      <div>
        <label htmlFor="kind" className="mb-1.5 block text-sm font-medium">Tip</label>
        <select id="kind" name="kind" className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
          <option value="percent">Procent (%)</option>
          <option value="amount">Sumă fixă (în moneda cursului)</option>
        </select>
      </div>
      <Field label="Valoare" name="value" type="number" step="0.01" min="0" required error={e?.value?.[0]} />
      <div>
        <label htmlFor="code_course" className="mb-1.5 block text-sm font-medium">Valabil pentru</label>
        <select id="code_course" name="course_id" className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base">
          <option value="">Toate cursurile</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <Field label="Număr maxim de utilizări (opțional)" name="max_uses" type="number" min="1" />
      <Field label="Începe la (programare, opțional)" name="starts_on" type="date" />
      <Field label="Expiră la (opțional)" name="expires_on" type="date" error={e?.expires_on?.[0]} />
      <div className="sm:col-span-2"><Field label="Notă internă (opțional)" name="note" /></div>
      <div className="sm:col-span-2 space-y-4">
        <Status message={state?.message} />
        <Button type="submit" disabled={pending}>{pending ? "Se salvează..." : "Creează codul"}</Button>
      </div>
    </form>
  );
}
