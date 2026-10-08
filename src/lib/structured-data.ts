import type { Course } from "@/lib/types";
import { contact } from "@/content/site";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro";

export const organization = {
  "@type": "EducationalOrganization",
  name: "Dental Masters Academy",
  url: siteUrl,
  email: contact.email,
  telephone: contact.phone,
  address: { "@type": "PostalAddress", streetAddress: "Str. Fabricii 46", addressLocality: "București", addressCountry: "RO" },
  sameAs: [contact.socialHref],
};

export type Rating = { avg: number; n: number } | null;

export function courseJsonLd(c: Course, rating: Rating, trainerName?: string | null) {
  const url = `${siteUrl}/cursuri/${c.slug}`;
  const physical = c.format !== "online";
  const instance = c.starts_at
    ? {
        "@type": "CourseInstance",
        courseMode: c.format === "online" ? "online" : c.format === "hybrid" ? ["onsite", "online"] : "onsite",
        startDate: c.starts_at,
        ...(c.ends_at ? { endDate: c.ends_at } : {}),
        ...(physical && c.location ? { location: { "@type": "Place", name: c.location, address: c.location } } : {}),
        ...(trainerName ? { instructor: { "@type": "Person", name: trainerName } } : {}),
      }
    : null;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.summary ?? c.title,
    url,
    inLanguage: c.language ?? "ro",
    provider: organization,
    ...(instance ? { hasCourseInstance: instance } : {}),
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: (c.price_cents / 100).toFixed(2),
      priceCurrency: c.currency || "EUR",
      url,
      availability: "https://schema.org/InStock",
    },
    ...(rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.avg, ratingCount: rating.n, bestRating: 5, worstRating: 1 } } : {}),
  };
}

export function eventJsonLd(c: Course, soldOut: boolean) {
  if (!c.starts_at || c.format === "online") return null;
  const url = `${siteUrl}/cursuri/${c.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: c.title,
    description: c.summary ?? c.title,
    startDate: c.starts_at,
    ...(c.ends_at ? { endDate: c.ends_at } : {}),
    eventAttendanceMode: c.format === "hybrid" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: c.location ?? "Dental Masters Academy", address: c.location ?? contact.address },
    organizer: { "@type": "Organization", name: "Dental Masters Academy", url: siteUrl },
    offers: {
      "@type": "Offer",
      url,
      price: (c.price_cents / 100).toFixed(2),
      priceCurrency: c.currency || "EUR",
      availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    url,
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function personJsonLd(t: { name: string; slug: string; role: string | null; bio: string | null; photo_url: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    url: `${siteUrl}/lectori/${t.slug}`,
    ...(t.role ? { jobTitle: t.role } : {}),
    ...(t.bio ? { description: t.bio.slice(0, 300) } : {}),
    ...(t.photo_url ? { image: t.photo_url } : {}),
    worksFor: { "@type": "EducationalOrganization", name: "Dental Masters Academy", url: siteUrl },
  };
}
