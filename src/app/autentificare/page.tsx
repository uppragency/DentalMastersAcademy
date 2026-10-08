import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Autentificare" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <Container className="max-w-md py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Intră în cont</h1>
      <p className="mt-2 text-muted">Accesează cursurile plătite și istoricul achizițiilor.</p>
      {error === "link" ? <p className="mt-6 rounded-xl bg-gold-soft px-4 py-3 text-sm">Linkul a expirat sau nu mai este valid. Autentifică-te cu parola.</p> : null}
      <div className="mt-8 rounded-3xl border border-line bg-card p-7">
        <LoginForm next={next} />
      </div>
    </Container>
  );
}
