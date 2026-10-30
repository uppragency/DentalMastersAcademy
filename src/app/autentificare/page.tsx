import { tr } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Autentificare", description: "Intră în contul tău Dental Masters Academy pentru a accesa cursurile, comenzile și programul tău." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title={tr("Intră în cont")} lead={tr("Accesează cursurile plătite și istoricul achizițiilor.")}>
      {error === "link" ? <p className="mb-5 rounded-xl bg-gold-soft px-4 py-3 text-sm">{tr("Linkul a expirat sau nu mai este valid. Autentifică-te cu parola.")}</p> : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}
