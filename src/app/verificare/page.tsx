import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Verificare adeverință", robots: { index: false } };

async function go(formData: FormData) {
  "use server";
  const n = String(formData.get("numar") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  redirect(n ? `/verificare/${n}` : "/verificare");
}

export default function VerifyIndex() {
  return (
    <Container className="max-w-xl py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Verificare adeverință</h1>
      <p className="mt-4 leading-relaxed text-muted">Introdu numărul de pe adeverința de participare pentru a confirma că a fost emisă de Dental Masters Academy.</p>
      <form action={go} className="mt-8 flex flex-wrap gap-3">
        <input name="numar" required placeholder="DMA-2026-0001" aria-label="Număr adeverință" className="min-h-12 flex-1 rounded-full border border-line bg-card px-5 text-base outline-none focus:border-gold" />
        <button type="submit" className="min-h-12 rounded-full bg-ink px-7 text-sm font-medium text-white">Verifică</button>
      </form>
    </Container>
  );
}
