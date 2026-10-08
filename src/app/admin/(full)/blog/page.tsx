import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/time";

export const metadata: Metadata = { title: "Blog | Administrare", robots: { index: false } };

export default async function AdminBlog() {
  const supabase = await createClient();
  const now = nowMs();
  const { data } = await supabase.from("blog_posts").select("id, title, published, published_at, created_at").order("created_at", { ascending: false });
  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between"><h1 className="text-3xl font-semibold tracking-tight">Blog</h1><ButtonLink href="/admin/blog/nou">Articol nou</ButtonLink></div>
      <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
        {(data ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/blog/${p.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-background">
              <span className="font-medium">{p.title}</span>
              <span className={`rounded-full px-3 py-1 text-xs ${p.published ? "bg-gold-soft text-gold" : "bg-line text-muted"}`}>{p.published ? (p.published_at && Date.parse(p.published_at) > now ? "Programat" : "Publicat") : "Ciornă"}</span>
            </Link>
          </li>
        ))}
        {(data ?? []).length === 0 ? <li className="p-8 text-center text-muted">Niciun articol.</li> : null}
      </ul>
    </div>
  );
}
