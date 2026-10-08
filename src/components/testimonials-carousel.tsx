"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Testimonial } from "@/lib/types";

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-3xl border border-line bg-card p-4 sm:rounded-[2rem] sm:p-8">
      <div>
        <svg aria-hidden="true" viewBox="0 0 40 32" className="h-6 w-8 text-gold sm:h-8 sm:w-10" fill="currentColor"><path d="M0 32V19C0 8 6 1.5 16 0l1.5 4C12 6 10 9.500 10 13h7v19H0zm23 0V19C23 8 29 1.500 39 0l1.500 4C35 6 33 9.500 33 13h7v19H23z" /></svg>
        <blockquote className="mt-4 text-[13px] leading-relaxed sm:mt-6 sm:text-[15px]">{t.quote}</blockquote>
      </div>
      <figcaption className="mt-5 flex items-center gap-2.5 border-t border-line pt-4 text-sm sm:mt-8 sm:gap-3 sm:pt-5">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-semibold text-gold sm:size-10 sm:text-sm">
          {t.author_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold sm:text-sm">{t.author_name}</span>
          {t.author_title ? <span className="block text-xs text-muted sm:text-sm">{t.author_title}</span> : null}
          {t.verified ? <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-gold">Cursant verificat</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

const arrow = "flex size-11 items-center justify-center rounded-full border border-line bg-background transition-colors enabled:hover:bg-card disabled:opacity-30";

/** Shows 3 testimonials per page on desktop and 2 on mobile; arrows move one full page. */
export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  if (items.length === 0) return null;
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });

  return (
    <div>
      <ul
        ref={track}
        onScroll={update}
        className="-mx-1 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Testimoniale"
      >
        {items.map((t) => (
          <li key={t.id} className="w-1/2 shrink-0 snap-start px-1.5 lg:w-1/3 lg:px-2.5">
            <Card t={t} />
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button type="button" aria-label="Testimoniale anterioare" className={arrow} onClick={() => go(-1)} disabled={edge.start}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" aria-label="Testimoniale următoare" className={arrow} onClick={() => go(1)} disabled={edge.end}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
