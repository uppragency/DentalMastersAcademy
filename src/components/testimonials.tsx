import type { Testimonial } from "@/lib/types";

export function TestimonialsGrid({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <li key={t.id} className="rounded-3xl border border-line bg-card p-7">
          <figure className="flex h-full flex-col">
          <blockquote className="text-[15px] leading-relaxed">„{t.quote}”</blockquote>
          <figcaption className="mt-6 border-t border-line pt-4 text-sm">
            <span className="font-semibold">{t.author_name}</span>
            {t.author_title ? <span className="block text-muted">{t.author_title}</span> : null}
          </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
