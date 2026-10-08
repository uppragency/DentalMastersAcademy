import type { Testimonial } from "@/lib/types";
import { Reveal } from "@/components/reveal";

function Quote({ t, big = false }: { t: Testimonial; big?: boolean }) {
  return (
    <figure className={`flex h-full flex-col justify-between rounded-[2rem] border p-8 ${big ? "border-white/10 bg-ink-2 text-white sm:p-12" : "border-line bg-card"}`}>
      <div>
        <svg aria-hidden="true" viewBox="0 0 40 32" className={`h-8 w-10 ${big ? "text-gold-bright" : "text-gold"}`} fill="currentColor"><path d="M0 32V19C0 8 6 1.5 16 0l1.5 4C12 6 10 9.500 10 13h7v19H0zm23 0V19C23 8 29 1.500 39 0l1.500 4C35 6 33 9.500 33 13h7v19H23z" /></svg>
        <blockquote className={`mt-6 leading-relaxed ${big ? "font-display text-2xl sm:text-3xl" : "text-[15px]"}`}>{t.quote}</blockquote>
      </div>
      <figcaption className={`mt-8 flex items-center gap-3 border-t pt-5 text-sm ${big ? "border-white/10" : "border-line"}`}>
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-gold-soft text-sm font-semibold text-gold">
          {t.author_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <span>
          <span className="block font-semibold">{t.author_name}</span>
          {t.author_title ? <span className={big ? "text-white/55" : "text-muted"}>{t.author_title}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsGrid({ items, featured = false }: { items: Testimonial[]; featured?: boolean }) {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  if (featured && first) {
    return (
      <div className="grid gap-5 lg:grid-cols-12">
        <Reveal className="lg:col-span-7"><Quote t={first} big /></Reveal>
        <ul className="grid gap-5 lg:col-span-5">
          {rest.slice(0, 2).map((t, i) => (
            <Reveal as="li" key={t.id} delay={(i + 1) * 100}><Quote t={t} /></Reveal>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => (
        <Reveal as="li" key={t.id} delay={(i % 3) * 90}><Quote t={t} /></Reveal>
      ))}
    </ul>
  );
}
