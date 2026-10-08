import { PostForm } from "@/components/content-forms";
import { createClient } from "@/lib/supabase/server";

export default async function NewPost() {
  const supabase = await createClient();
  const { data: trainers } = await supabase.from("trainers").select("id, name").order("sort_order");
  return (<div className="max-w-3xl"><h1 className="mb-8 text-3xl font-semibold tracking-tight">Articol nou</h1><PostForm trainers={trainers ?? []} /></div>);
}
