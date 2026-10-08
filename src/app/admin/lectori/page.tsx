import type { Metadata } from "next";
import { TrainerForm } from "@/components/content-forms";
import { createClient } from "@/lib/supabase/server";
import type { Trainer } from "@/lib/types";

export const metadata: Metadata = { title: "Lectori | Administrare", robots: { index: false } };

export default async function AdminTrainers() {
  const supabase = await createClient();
  const { data } = await supabase.from("trainers").select("*").order("sort_order");
  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Lectori</h1>
      {((data ?? []) as Trainer[]).map((t) => (
        <section key={t.id} className="rounded-3xl border border-line bg-card p-7"><TrainerForm trainer={t} /></section>
      ))}
    </div>
  );
}
