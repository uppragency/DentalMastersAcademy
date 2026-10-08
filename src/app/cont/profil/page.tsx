import type { Metadata } from "next";
import { ProfileForm, PasswordForm } from "@/components/account-forms";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function ProfilePage() {
  const profile = (await getCurrentProfile())!;
  return (
    <div className="max-w-xl space-y-12">
      <section aria-labelledby="data-title">
        <h1 id="data-title" className="text-3xl font-semibold tracking-tight">Date personale</h1>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><ProfileForm profile={profile} /></div>
      </section>
      <section aria-labelledby="pass-title">
        <h2 id="pass-title" className="text-2xl font-semibold tracking-tight">Parolă</h2>
        <div className="mt-6 rounded-3xl border border-line bg-card p-7"><PasswordForm /></div>
      </section>
    </div>
  );
}
