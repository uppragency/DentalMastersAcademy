import { tr } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Creează cont", description: "Creează-ți cont Dental Masters Academy pentru a te înscrie la cursuri, a urmări comenzile și a acumula puncte de fidelitate." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title={tr("Creează cont")} lead={tr("Un singur cont pentru toate cursurile tale.")}>
      <SignupForm next={next} />
    </AuthShell>
  );
}
