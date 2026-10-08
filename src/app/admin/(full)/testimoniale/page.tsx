import type { Metadata } from "next";
import { toggleTestimonial, deleteTestimonial } from "@/actions/admin";
import { TestimonialForm } from "@/components/admin-forms";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Testimoniale | Administrare", robots: { index: false } };

export default async function AdminTestimonials() {
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
  const items = data ?? [];
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Testimoniale</h1>
        <ul className="mt-8 space-y-4">
          {items.map((t) => (
            <li key={t.id} className="rounded-3xl border border-line bg-card p-6">
              <p className="text-[15px] leading-relaxed">„{t.quote}”</p>
              {!t.is_published && t.verified ? <p className="mb-3 inline-block rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold">Recenzie nouă de la un cursant, în așteptarea aprobării</p> : null}
              {t.verified && t.is_published ? <p className="mb-3 inline-block rounded-full bg-line px-3 py-1 text-xs text-muted">Cursant verificat</p> : null}
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
          {items.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">Nu există testimoniale.</li> : null}
        </ul>
      </section>
      <section className="h-fit rounded-3xl border border-line bg-card p-7">
        <h2 className="mb-5 text-lg font-semibold">Adaugă testimonial</h2>
        <TestimonialForm />
      </section>
    </div>
  );
}
