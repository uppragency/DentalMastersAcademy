import type { VideoSource } from "@/lib/video";

export function VideoPlayer({ source, title }: { source: VideoSource; title: string }) {
  if (!source) return null;
  if (source.kind === "iframe") {
    return (
      <iframe
        src={source.src}
        title={title}
        className="absolute inset-0 size-full"
        allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    );
  }
  if (source.kind === "file") {
    return <video src={source.src} controls controlsList="nodownload" playsInline preload="metadata" className="absolute inset-0 size-full bg-black" />;
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <a href={source.src} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink">Deschide lecția</a>
    </div>
  );
}
