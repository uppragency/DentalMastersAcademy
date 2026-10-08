import Link from "next/link";
import type { Course } from "@/lib/types";
import { formatDate, formatLabels, formatPrice } from "@/lib/format";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/cursuri/${course.slug}`}
      className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(15,22,35,0.25)]"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        {course.categories?.name ? (
          <span className="rounded-full bg-gold-soft px-3 py-1 text-gold">{course.categories.name}</span>
        ) : null}
        <span className="rounded-full border border-line px-3 py-1 text-muted">{formatLabels[course.format]}</span>
        {course.gold_free ? <span className="rounded-full bg-ink px-3 py-1 text-white">Gratuit Gold</span> : null}
      </div>
      <h3 className="mt-5 text-xl font-semibold leading-snug tracking-tight">{course.title}</h3>
      {course.summary ? <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{course.summary}</p> : null}
      <dl className="mt-auto grid gap-1 pt-6 text-sm text-muted">
        {course.trainer_name ? (
          <div className="flex gap-2"><dt className="sr-only">Formator</dt><dd>{course.trainer_name}</dd></div>
        ) : null}
        <div className="flex gap-2"><dt className="sr-only">Data</dt><dd>{formatDate(course.starts_at)}</dd></div>
      </dl>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
        <span className="text-lg font-semibold">{formatPrice(course.price_cents, course.currency)}</span>
        <span className="text-sm font-medium text-gold transition-transform group-hover:translate-x-0.5">Detalii →</span>
      </div>
    </Link>
  );
}
