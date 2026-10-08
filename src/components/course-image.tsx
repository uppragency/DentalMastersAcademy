import Image from "next/image";
import { CourseArt } from "@/components/course-art";

type Imgs = { slug: string; cover_url?: string | null; thumbnail_url?: string | null };

/**
 * Real course photo when uploaded, generated art otherwise.
 * "thumb" (grids, small cards) prefers the thumbnail, "cover" (wide hero) only uses the cover.
 * Parent must be `relative` with a set size.
 */
export function CourseImage({ course, variant, className = "", sizes, priority = false, artClassName }: {
  course: Imgs;
  variant: "thumb" | "cover";
  className?: string;
  sizes: string;
  priority?: boolean;
  artClassName?: string;
}) {
  const src = variant === "thumb" ? course.thumbnail_url || course.cover_url : course.cover_url;
  if (src) return <Image src={src} alt="" fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  return <CourseArt seed={course.slug} className={artClassName ?? className} />;
}
