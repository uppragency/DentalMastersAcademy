"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const arrow = "flex size-11 items-center justify-center rounded-full border border-line bg-background transition-colors enabled:hover:bg-card disabled:opacity-30";

/** Square (1:1) photo gallery. Up to 5 photos sit in a grid; more than 5 become a carousel (2 per page on mobile, 5 on desktop). */
export function GalleryCarousel({ images, title }: { images: string[]; title: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const carousel = images.length > 5;

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || !carousel) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, carousel]);

  if (images.length === 0) return null;
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });

  const tile = (src: string, i: number) => (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink">
      <Image src={src} alt={`${title}, fotografie ${i + 1}`} fill sizes="(min-width: 1024px) 15vw, 45vw" className="object-cover" />
    </div>
  );

  if (!carousel) {
    return (
      <ul className={`grid gap-3 ${images.length >= 5 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`} aria-label="Galerie foto">
        {images.map((src, i) => (<li key={src}>{tile(src, i)}</li>))}
      </ul>
    );
  }

  return (
    <div>
      <ul ref={track} onScroll={update} aria-label="Galerie foto" className="-mx-1.5 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <li key={src} className="w-1/2 shrink-0 snap-start px-1.5 sm:w-1/5">{tile(src, i)}</li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button type="button" aria-label="Fotografii anterioare" className={arrow} onClick={() => go(-1)} disabled={edge.start}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" aria-label="Fotografii următoare" className={arrow} onClick={() => go(1)} disabled={edge.end}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
