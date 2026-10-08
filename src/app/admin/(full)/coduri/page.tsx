import type { Metadata } from "next";
import Link from "next/link";
import { deleteDiscountCode, toggleDiscountCode } from "@/actions/admin";
import { DiscountCodeForm } from "@/components/admin-forms";
import { BulkCodesForm } from "@/components/staff-forms";
import { nowMs } from "@/lib/time";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Coduri de reducere | Administrare", robots: { index: false } };

export default async function AdminCodes() {
  const supabase = await createClient();
  const [{ data: codes }, { data: courses }] = await Promise.all([
    supabase.from("discount_codes").select("*, courses(title, currency)").order("created_at", { ascending: false }).limit(200),
    supabase.from("courses").select("id, title").order("title"),
  ]);
  return (
    <div className="max-w-4xl space-y-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Coduri de reducere</h1>
        <p className="mt-2 text-sm text-muted">Clientul introduce codul la finalizarea comenzii. Nu se cumulează cu reducerea Gold: se aplică cea mai mare.</p>
        <div className="mt-8 rounded-3xl border border-line bg-card p-7"><DiscountCodeForm courses={courses ?? []} /></div>
      </section>
      <section aria-labelledby="bulk">
        <h2 id="bulk" className="text-2xl font-semibold tracking-tight">Generare în masă</h2>
        <p className="mt-2 text-sm text-muted">Coduri unice, cu o singură utilizare, pentru o campanie (eveniment, parteneriat). Exporți lista după etichetă.</p>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><BulkCodesForm courses={courses ?? []} /></div>
      </section>
      <section aria-label="Coduri existente">
        <p className="mb-3 text-sm text-muted">Export campanie: <Link className="underline underline-offset-4" href="/admin/coduri/export" prefetch={false}>toate codurile</Link> (CSV). Ștergerea elimină codurile nefolosite; cele folosite se arhivează.</p>
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Cod</th><th className="p-4">Reducere</th><th className="p-4">Curs</th><th className="p-4">Utilizări</th><th className="p-4">Valabilitate</th><th className="p-4" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(codes ?? []).map((c) => {
                const course = c.courses as { title: string; currency: string } | null;
                return (
                  <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                    <td className="p-4 font-mono font-semibold">{c.code}{c.owner_user_id ? <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 font-sans text-[10px] text-gold">personal</span> : null}</td>
                    <td className="p-4">{c.kind === "percent" ? `${c.value}%` : formatPrice(c.value, course?.currency ?? "EUR")}</td>
                    <td className="p-4">{course?.title ?? "Toate"}</td>
                    <td className="p-4">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                    <td className="p-4">
                      {c.starts_at && new Date(c.starts_at).getTime() > nowMs() ? <span className="mr-2 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] text-gold">programat {new Date(c.starts_at).toLocaleDateString("ro-RO")}</span> : null}
                      {c.expires_at ? `până la ${new Date(c.expires_at).toLocaleDateString("ro-RO")}` : "fără expirare"}
                      {c.campaign ? <a href={`/admin/coduri/export?campanie=${encodeURIComponent(c.campaign)}`} className="block text-xs text-muted underline underline-offset-4">{c.campaign} (export)</a> : null}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/coduri/${c.id}`} className="inline-flex min-h-9 items-center rounded-full border border-line px-4 text-sm">Editează</Link>
                        <form action={toggleDiscountCode.bind(null, c.id, !c.active)}><Button type="submit" variant="ghost" className="min-h-9 px-4">{c.active ? "Dezactivează" : "Activează"}</Button></form>
                        <form action={deleteDiscountCode.bind(null, c.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">{c.used_count === 0 ? "Șterge" : "Arhivează"}</Button></form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(codes ?? []).length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted">Nu există coduri.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
