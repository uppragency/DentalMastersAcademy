import type { Metadata } from "next";
import { StatementMatcher } from "@/components/statement-matcher";
import { requireFullAdmin } from "@/lib/staff";

export const metadata: Metadata = { title: "Plăți din extras | Administrare", robots: { index: false } };

export default async function PaymentsPage() {
  await requireFullAdmin();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Plăți din extras</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Încarcă extrasul de cont în format CSV. Comenzile prin transfer care au referința în detalii sunt propuse spre confirmare. La confirmare se acordă înscrierea, se trimite emailul și se emite factura.</p>
      </header>
      <StatementMatcher />
    </div>
  );
}
