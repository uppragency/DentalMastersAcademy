import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Autentificare"), description: tr("Intră în contul tău Dental Masters Academy pentru a accesa cursurile, comenzile și programul tău.") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  await getLocale();
  const { next, error } = await searchParams;
  return (
    <AuthShell title={tr("Intră în cont")} lead={tr("Accesează cursurile plătite și istoricul achizițiilor.")}>
      {error === "link" ? <p className="mb-5 rounded-xl bg-gold-soft px-4 py-3 text-sm">{tr("Linkul a expirat sau nu mai este valid. Autentifică-te cu parola.")}</p> : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}
