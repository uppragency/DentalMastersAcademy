import type { Metadata } from "next";
import { deletePartner, savePartner } from "@/actions/dma";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { Partner } from "@/lib/types";

export const metadata: Metadata = { title: "Parteneri | Administrare", robots: { index: false } };

const input = "min-h-11 w-full rounded-xl border border-line bg-card px-4 text-base outline-none focus:border-gold";
const area = "w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-gold";
const fileCls = "block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white";

function PartnerForm({ p }: { p?: Partner }) {
  return (
    <form action={savePartner} className="space-y-4">
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Nume<input name="name" defaultValue={p?.name} required className={`${input} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Link site (https://)<input name="url" type="url" defaultValue={p?.url ?? ""} className={`${input} mt-1.5`} /></label>
      </div>
      <label className="block text-sm font-medium">Contribuția partenerului (descriere scurtă)<textarea name="description" rows={3} defaultValue={p?.description ?? ""} className={`${area} mt-1.5`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Logo (JPG, PNG, WebP, maximum 6 MB)<input type="file" name="logo" accept="image/jpeg,image/png,image/webp,image/avif" className={`${fileCls} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Ordine<input name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} className={`${input} mt-1.5`} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p ? p.published : true} className="size-4 accent-[#a9833d]" /> Afișat pe site</label>
      <Button type="submit">{p ? "Salvează" : "Adaugă partener"}</Button>
    </form>
  );
}

export default async function AdminPartners() {
  const supabase = await createClient();
  const { data } = await supabase.from("partners").select("*").order("sort_order");
  const partners = (data ?? []) as Partner[];
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Parteneri</h1>
      {partners.map((p) => (
        <section key={p.id} className="rounded-3xl border border-line bg-card p-7">
          <PartnerForm p={p} />
          <form action={deletePartner.bind(null, p.id)} className="mt-3"><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Șterge partenerul</Button></form>
        </section>
      ))}
      <section className="rounded-3xl border border-dashed border-line p-7">
        <h2 className="mb-5 text-xl font-semibold">Partener nou</h2>
        <PartnerForm />
      </section>
    </div>
  );
}
