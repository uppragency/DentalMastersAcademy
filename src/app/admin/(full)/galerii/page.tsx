import type { Metadata } from "next";
import { addAlbumPhotos, createAlbum, deleteAlbum, deletePhoto, deleteTestimonialVideo, saveTestimonialVideo, toggleAlbum, toggleTestimonialVideo } from "@/actions/dma";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { GalleryAlbum, TestimonialVideo } from "@/lib/types";

export const metadata: Metadata = { title: "Galerii și video | Administrare", robots: { index: false } };

const input = "min-h-11 w-full rounded-xl border border-line bg-card px-4 text-base outline-none focus:border-gold";
const fileCls = "block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-white";

export default async function AdminGalleries() {
  const supabase = await createClient();
  const [albums, videos, courses] = await Promise.all([
    supabase.from("gallery_albums").select("*, gallery_photos(*)").order("created_at", { ascending: false }),
    supabase.from("testimonial_videos").select("*, courses(title)").order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title, starts_at").neq("status", "archived").order("title"),
  ]);
  const courseOptions = (courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>);
  return (
    <div className="max-w-4xl space-y-14">
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Galerii foto</h1>
        <p className="text-sm text-muted">Un album pentru fiecare curs și ediție din trecut. Pozele apar pe pagina Testimoniale.</p>
        {((albums.data ?? []) as GalleryAlbum[]).map((a) => (
          <article key={a.id} className="rounded-3xl border border-line bg-card p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <p className="text-sm text-muted">{a.edition_label ?? "Fără ediție"} · {a.gallery_photos.length} poze · {a.published ? "Afișat" : "Ascuns"}</p>
              </div>
              <div className="flex gap-2">
                <form action={toggleAlbum.bind(null, a.id, !a.published)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">{a.published ? "Ascunde" : "Publică"}</Button></form>
                <form action={deleteAlbum.bind(null, a.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Șterge albumul</Button></form>
              </div>
            </div>
            {a.gallery_photos.length > 0 ? (
              <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {a.gallery_photos.map((p) => (
                  <li key={p.id} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <form action={deletePhoto.bind(null, p.id)}><button type="submit" className="text-xs text-red-700 underline">Șterge</button></form>
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={addAlbumPhotos.bind(null, a.id)} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium">Adaugă poze (maximum 30 odată, 8 MB per poză)<input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp,image/avif" className={`${fileCls} mt-1.5`} /></label>
              <Button type="submit">Încarcă</Button>
            </form>
          </article>
        ))}
        <form action={createAlbum} className="space-y-4 rounded-3xl border border-dashed border-line p-7">
          <h2 className="text-xl font-semibold">Album nou</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">Titlu<input name="title" required className={`${input} mt-1.5`} placeholder="Bone Grafting" /></label>
            <label className="block text-sm font-medium">Ediția<input name="edition_label" className={`${input} mt-1.5`} placeholder="Septembrie 2026" /></label>
            <label className="block text-sm font-medium">Curs<select name="course_id" className={`${input} mt-1.5`}><option value="">Fără curs</option>{courseOptions}</select></label>
          </div>
          <Button type="submit">Creează albumul</Button>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight">Testimoniale video</h2>
        <p className="text-sm text-muted">Link YouTube, Vimeo sau fișier mp4 (https). Numele se afișează automat cu Dr. în față.</p>
        <ul className="space-y-3">
          {((videos.data ?? []) as TestimonialVideo[]).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-4 text-sm">
              <span><span className="font-semibold">{v.author_name}</span><span className="text-muted"> · {v.courses?.title ?? "Fără curs"} · {v.is_published ? "Afișat" : "Ascuns"}</span></span>
              <span className="flex gap-2">
                <form action={toggleTestimonialVideo.bind(null, v.id, !v.is_published)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm">{v.is_published ? "Ascunde" : "Publică"}</Button></form>
                <form action={deleteTestimonialVideo.bind(null, v.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-sm text-red-700">Șterge</Button></form>
              </span>
            </li>
          ))}
        </ul>
        <form action={saveTestimonialVideo} className="space-y-4 rounded-3xl border border-dashed border-line p-7">
          <h3 className="text-xl font-semibold">Video nou</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Nume participant (fără Dr.)<input name="author_name" required className={`${input} mt-1.5`} /></label>
            <label className="block text-sm font-medium">Curs<select name="course_id" className={`${input} mt-1.5`}><option value="">Fără curs</option>{courseOptions}</select></label>
            <label className="block text-sm font-medium sm:col-span-2">Link video (https)<input name="video_url" type="url" required className={`${input} mt-1.5`} /></label>
            <label className="block text-sm font-medium sm:col-span-2">Titlu (opțional)<input name="title" className={`${input} mt-1.5`} /></label>
          </div>
          <Button type="submit">Adaugă video</Button>
        </form>
      </section>
    </div>
  );
}
