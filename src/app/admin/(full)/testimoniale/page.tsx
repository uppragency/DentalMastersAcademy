import type { Metadata } from "next";
import { toggleTestimonial, deleteTestimonial } from "@/actions/admin";
import { approveTestimonial, rejectTestimonial } from "@/actions/ops";
import { TestimonialForm } from "@/components/admin-forms";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Testimoniale | Administrare", robots: { index: false } };

type T = { id: string; quote: string; author_name: string; author_title: string | null; is_published: boolean; verified: boolean };

export default async function AdminTestimonials() {
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
  const items = (data ?? []) as T[];
  const pending = items.filter((t) => !t.is_published && t.verified);
  const rest = items.filter((t) => !pending.includes(t));
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Testimoniale</h1>
        {pending.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">De aprobat ({pending.length})</h2>
            <p className="mt-1 text-sm text-muted">Recenzii trimise de cursanți verificați, cu acord de publicare. Nu apar pe site până nu le aprobi.</p>
            <ul className="mt-4 space-y-4">
              {pending.map((t) => (
                <li key={t.id} className="rounded-3xl border border-gold bg-gold-soft p-6">
                  <p className="text-[15px] leading-relaxed">„{t.quote}”</p>
                  <p className="mt-3 text-sm"><span className="font-semibold">{t.author_name}</span>{t.author_title ? <span className="text-muted">, {t.author_title}</span> : null}</p>
                  <div className="mt-4 flex gap-2">
                    <form action={approveTestimonial.bind(null, t.id)}><Button type="submit" className="min-h-9 px-5 text-sm">Aprobă și publică</Button></form>
                    <form action={rejectTestimonial.bind(null, t.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Respinge</Button></form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <h2 className="mt-10 text-xl font-semibold">Toate</h2>
        <ul className="mt-4 space-y-4">
          {rest.map((t) => (
            <li key={t.id} className="rounded-3xl border border-line bg-card p-6">
              <p className="text-[15px] leading-relaxed">„{t.quote}”</p>
              {t.verified && t.is_published ? <p className="mt-3 inline-block rounded-full bg-line px-3 py-1 text-xs text-muted">Cursant verificat</p> : null}
              <p className="mt-3 text-sm"><span className="font-semibold">{t.author_name}</span>{t.author_title ? <span className="text-muted">, {t.author_title}</span> : null}</p>
              <div className="mt-4 flex gap-2">
                <form action={toggleTestimonial.bind(null, t.id, !t.is_published)}>
                  <Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">{t.is_published ? "Ascunde" : "Publică"}</Button>
                </form>
                <form action={deleteTestimonial.bind(null, t.id)}>
                  <Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Șterge</Button>
                </form>
              </div>
            </li>
          ))}
          {rest.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">Nu există testimoniale.</li> : null}
        </ul>
      </section>
      <section className="h-fit rounded-3xl border border-line bg-card p-7">
        <h2 className="mb-5 text-lg font-semibold">Adaugă testimonial</h2>
        <TestimonialForm />
      </section>
    </div>
  );
}
