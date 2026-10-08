import type { Metadata } from "next";
import { deleteEvent } from "@/actions/content";
import { EventForm } from "@/components/content-forms";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Evenimente | Administrare", robots: { index: false } };

export default async function AdminEvents() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("id, title, event_date, participants").order("event_date", { ascending: false });
  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Evenimente (galerie ediții anterioare)</h1>
      <div className="rounded-3xl border border-line bg-card p-7"><EventForm /></div>
      <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
        {(data ?? []).map((ev) => (
          <li key={ev.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
            <span>{ev.title} <span className="text-muted">· {ev.event_date}{ev.participants ? ` · ${ev.participants} participanți` : ""}</span></span>
            <form action={deleteEvent.bind(null, ev.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">Șterge</Button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
