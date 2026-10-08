import type { Metadata } from "next";
import { toggleDiscountCode } from "@/actions/admin";
import { DiscountCodeForm } from "@/components/admin-forms";
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
      <section aria-label="Coduri existente">
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Cod</th><th className="p-4">Reducere</th><th className="p-4">Curs</th><th className="p-4">Utilizări</th><th className="p-4">Expiră</th><th className="p-4" /></tr>
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
                    <td className="p-4">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("ro-RO") : "Fără"}</td>
                    <td className="p-4 text-right">
                      <form action={toggleDiscountCode.bind(null, c.id, !c.active)}><Button type="submit" variant="ghost" className="min-h-9 px-4">{c.active ? "Dezactivează" : "Activează"}</Button></form>
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
