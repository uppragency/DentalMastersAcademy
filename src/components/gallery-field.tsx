"use client";

import { useRef, useState } from "react";

const SIZE = 1000;

/** Center-crops to a square and downsizes in the browser, so many photos fit the upload limit. */
async function squareJpeg(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const out = Math.min(SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function GalleryField({ existing }: { existing: string[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10);
    if (files.length === 0) return;
    setNote("Se pregătesc imaginile...");
    try {
      const done = await Promise.all(files.map(squareJpeg));
      const dt = new DataTransfer();
      done.forEach((f) => dt.items.add(f));
      if (input.current) input.current.files = dt.files;
      const kb = Math.round(done.reduce((s, f) => s + f.size, 0) / 1024);
      setNote(`${done.length} imagini pregătite (decupate 1:1, ${kb} KB în total).`);
    } catch {
      setNote("Imaginile au fost păstrate în forma originală.");
    }
  }

  return (
    <div className="rounded-2xl border border-line p-4">
      <label htmlFor="gallery" className="mb-1.5 block text-sm font-medium">Galerie foto (pătrate 1:1, apare sub „Despre curs”)</label>
      {existing.length > 0 ? (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {existing.map((u) => (
            <li key={u}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <label className="mt-1 flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" name="remove_gallery" value={u} className="size-4" /> Șterge</label>
            </li>
          ))}
        </ul>
      ) : null}
      <input ref={input} onChange={onChange} id="gallery" type="file" name="gallery" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white" />
      <p className="mt-2 text-xs text-muted">Poți alege mai multe odată (maximum 10 pe salvare, maximum 20 în total). Imaginile se decupează automat pătrat. Până la 5 fotografii apar în grilă, peste 5 devin carusel.</p>
      {note ? <p role="status" className="mt-2 text-xs text-gold">{note}</p> : null}
    </div>
  );
}
