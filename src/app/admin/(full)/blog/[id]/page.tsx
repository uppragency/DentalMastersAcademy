import { notFound } from "next/navigation";
import { deletePost } from "@/actions/content";
import { PostForm } from "@/components/content-forms";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Editare articol</h1>
      <PostForm post={data as BlogPost} />
      <form action={deletePost.bind(null, id)} className="mt-10 border-t border-line pt-6"><Button type="submit" variant="ghost" className="text-red-700">Șterge articolul</Button></form>
    </div>
  );
}
