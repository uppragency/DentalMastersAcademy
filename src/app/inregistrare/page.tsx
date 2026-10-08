import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Creează cont" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <Container className="max-w-md py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Creează cont</h1>
      <p className="mt-2 text-muted">Un singur cont pentru toate cursurile tale.</p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-7">
        <SignupForm next={next} />
      </div>
    </Container>
  );
}
