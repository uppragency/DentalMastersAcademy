"use client";

import { useEffect, useState } from "react";
import type { GalleryAlbum } from "@/lib/types";

export function PhotoGallery({ albums }: { albums: (GalleryAlbum & { courseTitle: string | null })[] }) {
  const [open, setOpen] = useState<{ album: number; photo: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const photos = albums[open.album]?.gallery_photos.length ?? 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o ? { ...o, photo: (o.photo + 1) % photos } : o));
      if (e.key === "ArrowLeft") setOpen((o) => (o ? { ...o, photo: (o.photo - 1 + photos) % photos } : o));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, albums]);

  const current = open ? albums[open.album]?.gallery_photos[open.photo] : null;

  return (
    <div className="space-y-14">
      {albums.map((a, ai) => (
        <section key={a.id} aria-labelledby={`album-${a.id}`}>
          <h3 id={`album-${a.id}`} className="font-display text-2xl">{a.courseTitle ?? a.title}</h3>
          <p className="mt-1 text-sm text-muted">{[a.courseTitle ? a.title : null, a.edition_label].filter(Boolean).join(" · ")}</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {a.gallery_photos.map((p, pi) => (
              <li key={p.id}>
                <button type="button" onClick={() => setOpen({ album: ai, photo: pi })} className="block w-full overflow-hidden rounded-2xl" aria-label={`Deschide fotografia ${pi + 1} din ${a.gallery_photos.length}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? a.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {current ? (
        <div role="dialog" aria-modal="true" aria-label="Fotografie" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.caption ?? ""} className="max-h-[88vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setOpen(null)} aria-label="Închide" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/15 text-xl text-white">×</button>
        </div>
      ) : null}
    </div>
  );
}
