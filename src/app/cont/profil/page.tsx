import type { Metadata } from "next";
import { ProfileForm, PasswordForm } from "@/components/account-forms";
import { deleteBillingProfile } from "@/actions/account";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { BillingProfile } from "@/lib/billing";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function ProfilePage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();
  const { data: billing } = await supabase
    .from("billing_profiles")
    .select("id, kind, name, cui, reg_com, address, city, county, country")
    .order("created_at", { ascending: false });
  const profiles = (billing ?? []) as BillingProfile[];
  return (
    <div className="max-w-xl space-y-12">
      <section aria-labelledby="data-title">
        <h1 id="data-title" className="font-display text-4xl font-medium">Date personale</h1>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><ProfileForm profile={profile} /></div>
      </section>
      <section aria-labelledby="bill-title">
        <h2 id="bill-title" className="text-2xl font-semibold tracking-tight">Profiluri de facturare</h2>
        <p className="mt-2 text-sm text-muted">Se salvează la achiziție și pot fi alese la comenzile următoare.</p>
        {profiles.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 rounded-3xl border border-line bg-card p-6 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-muted">
                    {p.kind === "company" ? `Firmă · CUI ${p.cui}${p.reg_com ? ` · ${p.reg_com}` : ""}` : "Persoană fizică"}
                  </p>
                  <p className="text-muted">{p.address}, {p.city}, {p.county}</p>
                </div>
                <form action={deleteBillingProfile.bind(null, p.id)}><Button type="submit" variant="ghost" className="min-h-9 px-4 text-red-700">Șterge</Button></form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">Nu ai profiluri de facturare salvate.</p>
        )}
      </section>
      <section aria-labelledby="pass-title">
        <h2 id="pass-title" className="text-2xl font-semibold tracking-tight">Parolă</h2>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><PasswordForm /></div>
      </section>
    </div>
  );
}
