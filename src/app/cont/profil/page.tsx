import type { Metadata } from "next";
import { DeleteAccountForm, EmailForm, PasswordForm, ProfileForm, SignOutAllForm } from "@/components/account-forms";
import { deleteBillingProfile } from "@/actions/account";
import { Button } from "@/components/ui";
import { BillingProfileForm } from "@/components/billing-profile-form";
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
    <div className="space-y-12">
      <section aria-labelledby="data-title">
        <h1 id="data-title" className="font-display text-4xl font-medium">Date personale</h1>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><ProfileForm profile={profile} /></div>
      </section>
      <section aria-labelledby="bill-title">
        <h2 id="bill-title" className="text-2xl font-semibold tracking-tight">Profiluri de facturare</h2>
        <p className="mt-2 text-sm text-muted">Adaugă profiluri aici sau la achiziție. La checkout alegi unul dintre ele sau introduci unul nou.</p>
        {profiles.length > 0 ? (
          <ul className="mt-6 grid gap-3 lg:grid-cols-2">
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
        <div className="mt-6 rounded-3xl border border-line bg-card p-7">
          <h3 className="mb-5 text-lg font-semibold">Adaugă profil de facturare</h3>
          <BillingProfileForm />
        </div>
      </section>
      <section aria-labelledby="pass-title">
        <h2 id="pass-title" className="text-2xl font-semibold tracking-tight">Parolă</h2>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><PasswordForm /></div>
      </section>
      <section aria-labelledby="email-title">
        <h2 id="email-title" className="text-2xl font-semibold tracking-tight">Email și sesiuni</h2>
        <p className="mt-2 text-sm text-muted">Emailul curent: {profile.email}. Schimbarea cere confirmare prin linkul trimis la adresa nouă.</p>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><EmailForm current={profile.email} /></div>
        <div className="mt-4 rounded-3xl border border-line bg-card p-7">
          <p className="text-sm text-muted">Dacă ai folosit contul pe un dispozitiv străin, închide toate sesiunile active. Va trebui să te autentifici din nou peste tot.</p>
          <div className="mt-4"><SignOutAllForm /></div>
        </div>
      </section>
      <section aria-labelledby="data-gdpr">
        <h2 id="data-gdpr" className="text-2xl font-semibold tracking-tight">Datele tale</h2>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7">
          <p className="text-sm text-muted">Descarcă toate datele asociate contului tău (profil, comenzi, înscrieri, adeverințe, puncte) într-un fișier JSON.</p>
          <a href="/api/cont/export" className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-medium hover:bg-background">Descarcă datele mele</a>
        </div>
        <div className="mt-4 rounded-3xl border border-red-200 bg-card p-7">
          <h3 className="text-lg font-semibold">Ștergere cont</h3>
          <p className="mt-2 text-sm text-muted">Datele tale personale se șterg definitiv. Comenzile și facturile se păstrează, conform obligațiilor legale, fără să mai fie asociate numelui tău. Acțiunea nu se poate anula.</p>
          <div className="mt-5"><DeleteAccountForm /></div>
        </div>
      </section>
    </div>
  );
}
