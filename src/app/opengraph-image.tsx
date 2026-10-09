import { ogImage, ogSize } from "@/lib/og";

export const alt = "Dental Masters Academy: cursuri de înaltă specializare pentru medici stomatologi";
export const size = ogSize;
export const contentType = "image/png";

/** Default share image for every page that has no image of its own (courses and lecturers define theirs). */
export default function Image() {
  return ogImage({
    eyebrow: "Cursuri pentru medici stomatologi",
    title: "Dental Masters Academy",
    subtitle: "Cursuri de înaltă specializare pentru medicii stomatologi. Înscriere și plată online.",
    footer: "dentalmasters.ro",
  });
}
