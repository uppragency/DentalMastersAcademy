import type { Metadata } from "next";
import { Container, SectionTitle } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { TestimonialsGrid } from "@/components/testimonials";
import { PhotoGallery } from "@/components/photo-gallery";
import { VideoPlayer } from "@/components/video-player";
import { getAlbums, getTestimonials, getTestimonialVideos } from "@/lib/data";
import { drName } from "@/lib/names";
import { parseVideo } from "@/lib/video";

export const metadata: Metadata = { title: "Testimoniale", description: "Ce spun medicii stomatologi care au participat la cursurile Dental Masters Academy: fotografii din ediții, mărturii scrise și video." };

export default async function TestimonialsPage() {
  const [items, albums, videos] = await Promise.all([getTestimonials(), getAlbums(), getTestimonialVideos()]);
  const withPhotos = albums.filter((a) => a.gallery_photos.length > 0).map((a) => ({ ...a, courseTitle: a.courses?.title ?? null }));
  const playable = videos.map((v) => ({ v, source: parseVideo(v.video_url) })).filter((x) => x.source);
  const empty = items.length === 0 && withPhotos.length === 0 && playable.length === 0;
  return (
    <>
      <PageHero eyebrow="Testimoniale" title={<>Ce spun <span className="text-gold-sheen">participanții.</span></>} lead="Fotografii din ediții, păreri scrise și impresii video ale medicilor care au trecut prin cursurile noastre." />
      <Container className="space-y-24 py-16 sm:py-24">
        {withPhotos.length > 0 ? (
          <section aria-labelledby="t-foto">
            <div id="t-foto"><SectionTitle eyebrow="Din ediții" title="Momente din cursurile noastre." /></div>
            <div className="mt-12"><PhotoGallery albums={withPhotos} /></div>
          </section>
        ) : null}
        {items.length > 0 ? (
          <section aria-labelledby="t-text">
            <div id="t-text"><SectionTitle eyebrow="Mărturii" title="Păreri scrise." /></div>
            <div className="mt-12"><TestimonialsGrid items={items} /></div>
          </section>
        ) : null}
        {playable.length > 0 ? (
          <section aria-labelledby="t-video">
            <div id="t-video"><SectionTitle eyebrow="Video" title="Impresii despre cursuri, lucrul hands-on și lectori." /></div>
            <ul className="mt-12 grid gap-8 md:grid-cols-2">
              {playable.map(({ v, source }) => (
                <li key={v.id}>
                  <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-ink">
                    <VideoPlayer source={source} title={`${drName(v.author_name)}${v.courses?.title ? ` · ${v.courses.title}` : ""}`} />
                  </div>
                  <p className="mt-4 font-semibold">{drName(v.author_name)}{v.courses?.title ? <span className="font-normal text-muted"> · {v.courses.title}</span> : null}</p>
                  {v.title ? <p className="text-sm text-muted">{v.title}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {empty ? <p className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Testimonialele vor apărea aici.</p> : null}
      </Container>
    </>
  );
}
