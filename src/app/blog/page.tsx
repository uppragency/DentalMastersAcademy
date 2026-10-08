import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Blog", description: "Articole scurte despre implantologie, parodontologie și protetică, scrise de echipa academiei." };

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHero eyebrow="Blog" title="Articole pentru medici." lead="Explicații scurte și practice din cursurile și cazurile academiei." />
      <section className="py-20">
        <Container>
          {posts.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-12 text-center text-muted">Articolele vor fi publicate în curând.</p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 3) * 90}>
                  <Link href={`/blog/${p.slug}`} className="flex h-full flex-col rounded-[2rem] border border-line bg-card p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(8,13,23,0.45)]">
                    <p className="text-xs text-muted">{formatDate(p.published_at)} · {p.author_name}</p>
                    <h2 className="font-display mt-4 text-2xl leading-snug">{p.title}</h2>
                    {p.excerpt ? <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.excerpt}</p> : null}
                    <span className="mt-auto pt-6 text-sm font-medium text-gold">Citește articolul</span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
