import type { Metadata } from "next";
import { deleteClinicalCase, saveClinicalCase } from "@/actions/dma";
import { TrainerForm } from "@/components/content-forms";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { ClinicalCase, Trainer } from "@/lib/types";

export const metadata: Metadata = { title: "Lectori | Administrare", robots: { index: false } };

const input = "min-h-11 w-full rounded-xl border border-line bg-card px-4 text-base outline-none focus:border-gold";
const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-gold";
const fileCls = "block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white";

function CaseForm({ trainerId, c }: { trainerId: string; c?: ClinicalCase }) {
  return (
    <form action={saveClinicalCase} className="space-y-3">
      <input type="hidden" name="trainer_id" value={trainerId} />
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <label className="block text-sm font-medium">Titlul cazului<input name="title" defaultValue={c?.title} required className={`${input} mt-1.5`} /></label>
      <label className="block text-sm font-medium">Descriere (fără date de identificare ale pacientului)<textarea name="description" rows={3} defaultValue={c?.description ?? ""} className={`${area} mt-1.5`} /></label>
      <label className="block text-sm font-medium">Imagini (maximum 8 odată, 6 MB per imagine){c ? ` · acum ${c.image_urls.length}` : ""}<input type="file" name="images" multiple accept="image/jpeg,image/png,image/webp,image/avif" className={`${fileCls} mt-1.5`} /></label>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <label className="flex items-center gap-2">Ordine<input name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} className="min-h-9 w-20 rounded-lg border border-line bg-card px-2" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={c ? c.published : true} className="size-4 accent-[#a9833d]" /> Afișat</label>
        {c ? <label className="flex items-center gap-2"><input type="checkbox" name="clear_images" className="size-4 accent-[#a9833d]" /> Elimină imaginile existente</label> : null}
      </div>
      <p className="text-xs text-muted">Publică doar cazuri cu acordul scris al pacientului.</p>
      <Button type="submit" className="min-h-10 px-6 text-sm">{c ? "Salvează cazul" : "Adaugă cazul"}</Button>
    </form>
  );
}

export default async function AdminTrainers() {
  const supabase = await createClient();
  const [{ data }, { data: cases }] = await Promise.all([supabase.from("trainers").select("*").order("sort_order"), supabase.from("clinical_cases").select("*").order("sort_order")]);
  const byTrainer = new Map<string, ClinicalCase[]>();
  for (const c of (cases ?? []) as ClinicalCase[]) byTrainer.set(c.trainer_id, [...(byTrainer.get(c.trainer_id) ?? []), c]);
  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Lectori</h1>
      {((data ?? []) as Trainer[]).map((t) => (
        <section key={t.id} className="rounded-3xl border border-line bg-card p-7">
          <TrainerForm trainer={t} />
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="text-lg font-semibold">Cazuri clinice documentate</h2>
            <ul className="mt-4 space-y-5">
              {(byTrainer.get(t.id) ?? []).map((c) => (
                <li key={c.id} className="rounded-2xl border border-line p-5">
                  <CaseForm trainerId={t.id} c={c} />
                  <form action={deleteClinicalCase.bind(null, c.id)} className="mt-2"><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Șterge cazul</Button></form>
                </li>
              ))}
            </ul>
            <details className="mt-5 rounded-2xl border border-dashed border-line p-5">
              <summary className="cursor-pointer text-sm font-medium">Caz nou</summary>
              <div className="mt-4"><CaseForm trainerId={t.id} /></div>
            </details>
          </div>
        </section>
      ))}
    </div>
  );
}
