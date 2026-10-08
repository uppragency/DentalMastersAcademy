"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const arrow = "flex size-11 items-center justify-center rounded-full border border-line bg-background transition-colors enabled:hover:bg-card disabled:opacity-30";

/** Square (1:1) photo gallery. Mobile: 4 per page carousel. Desktop: grid up to 5 photos, carousel above 5. */
export function GalleryCarousel({ images, title }: { images: string[]; title: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const carousel = images.length > 5; // desktop: grid up to 5, carousel above. Mobile: always a 4-up carousel.

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

  if (images.length === 0) return null;
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });
  const showArrows = carousel || images.length > 4;
  const cols = images.length >= 5 ? "sm:grid-cols-5" : "sm:grid-cols-4";

  return (
    <div>
      <ul
        ref={track}
        onScroll={update}
        aria-label="Galerie foto"
        className={`-mx-1 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${carousel ? "" : `sm:mx-0 sm:grid sm:gap-3 sm:overflow-visible sm:pb-0 ${cols}`}`}
      >
        {images.map((src, i) => (
          <li key={src} className={`w-1/4 shrink-0 snap-start px-1 ${carousel ? "sm:w-1/5 sm:px-1.5" : "sm:w-auto sm:px-0"}`}>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-ink sm:rounded-2xl">
              <Image src={src} alt={`${title}, fotografie ${i + 1}`} fill sizes="(min-width: 1024px) 15vw, 25vw" className="object-cover" />
            </div>
          </li>
        ))}
      </ul>
      {showArrows ? (
        <div className={`mt-4 flex items-center justify-end gap-3 ${carousel ? "" : "sm:hidden"}`}>
          <button type="button" aria-label="Fotografii anterioare" className={arrow} onClick={() => go(-1)} disabled={edge.start}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" aria-label="Fotografii următoare" className={arrow} onClick={() => go(1)} disabled={edge.end}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
