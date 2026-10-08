import Link from "next/link";
import type { Course } from "@/lib/types";
import { dayNum, formatDateRange, formatPrice, monthShort } from "@/lib/format";
import { CourseArt } from "@/components/course-art";
import { CardSeats } from "@/components/card-seats";

export function CourseCard({ course, ended = false }: { course: Course; ended?: boolean }) {
  return (
    <Link
      href={`/cursuri/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(8,13,23,0.45)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        <CourseArt seed={course.slug} className="size-full transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        {course.starts_at ? (
          <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-3.5 py-2 text-center leading-none shadow-lg backdrop-blur">
            <span className="block text-xl font-semibold tracking-tight">{dayNum(course.starts_at)}</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-widest text-gold">{monthShort(course.starts_at)}</span>
          </div>
        ) : null}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2 text-[11px] font-semibold">
          {ended ? <span className="rounded-full bg-red-600/90 px-3 py-1 text-white backdrop-blur">Înscrieri închise</span> : null}
          {course.gold_free ? <span className="rounded-full bg-gold px-3 py-1 text-white">Gratuit Gold</span> : null}
        </div>
        {course.language ? (
          <span className="absolute bottom-4 left-4 rounded-full border border-white/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
            {course.language}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-7">
        {course.categories?.name ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{course.categories.name}</p>
        ) : null}
        <h3 className="font-display mt-3 text-balance text-2xl font-medium leading-tight">{course.title}</h3>
        {course.summary ? <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted">{course.summary}</p> : null}
        <p className="mt-auto pt-6 text-sm text-muted">{formatDateRange(course.starts_at, course.ends_at)}</p>
        {!ended && course.capacity ? <div className="mt-3"><CardSeats courseId={course.id} capacity={course.capacity} /></div> : null}
        <div className="mt-4 flex items-end justify-between border-t border-line pt-5">
          <div>
            {course.old_price_cents ? (
              <span className="mr-2 text-sm text-muted line-through">{formatPrice(course.old_price_cents, course.currency)}</span>
            ) : null}
            <span className="text-xl font-semibold tracking-tight">{formatPrice(course.price_cents, course.currency)}</span>
          </div>
          {ended ? <span className="sr-only">Înscrierile sunt închise</span> : null}
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-white transition-all duration-300 group-hover:bg-gold group-hover:pl-0.5">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15L15 5M7 5h8v8" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
