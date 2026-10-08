import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Container } from "@/components/ui";
import { getPostBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPostBySlug((await params).slug);
  return p ? { title: p.title, description: p.excerpt ?? undefined, openGraph: { type: "article" } } : {};
}

export default async function PostPage({ params }: Props) {
  const p = await getPostBySlug((await params).slug);
  if (!p) notFound();
  const blocks = p.body.split(/\n\n+/).filter(Boolean);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    datePublished: p.published_at,
    author: { "@type": "Organization", name: p.author_name },
    publisher: { "@type": "Organization", name: "Dental Masters Academy" },
  };
  return (
    <article className="py-16 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Container className="max-w-3xl">
        <Link href="/blog" className="text-sm text-muted hover:text-foreground">← Blog</Link>
        <h1 className="font-display mt-6 text-balance text-4xl font-medium leading-tight sm:text-6xl">{p.title}</h1>
        <p className="mt-5 text-sm text-muted">{formatDate(p.published_at)} · {p.author_name}</p>
        <div className="mt-10 space-y-6 text-lg leading-relaxed">
          {blocks.map((b, i) => {
            const lines = b.split("\n");
            return lines.length === 1 && b.length < 70 && !/[.:]$/.test(b)
              ? <h2 key={i} className="font-display pt-4 text-2xl">{b}</h2>
              : <p key={i} className="text-foreground/85">{b}</p>;
          })}
        </div>
        <div className="mt-14 rounded-3xl bg-ink p-8 text-white">
          <p className="font-display text-2xl">Vrei să aprofundezi?</p>
          <p className="mt-2 text-white/65">Vezi cursurile hands-on din academie.</p>
          <ButtonLink href="/cursuri" variant="gold" className="mt-6">Vezi cursurile</ButtonLink>
        </div>
      </Container>
    </article>
  );
}
