"use client";

import { useActionState } from "react";
import { confirmStatementMatches, matchStatement } from "@/actions/staff";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export function StatementMatcher() {
  const [state, action, pending] = useActionState(matchStatement, undefined);
  const [done, confirm, confirming] = useActionState(confirmStatementMatches, undefined);

  return (
    <div className="space-y-8">
      <form action={action} className="flex flex-wrap items-end gap-4 rounded-3xl border border-line bg-card p-6">
        <div>
          <label htmlFor="file" className="mb-1.5 block text-sm font-medium">Extras de cont (CSV)</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required className="block text-sm file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-background" />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Se analizează..." : "Caută potriviri"}</Button>
        <p className="w-full text-xs text-muted">Potrivirea se face după referința comenzii (primele 8 caractere) din detaliile plății. Nimic nu se marchează până nu confirmi.</p>
      </form>

      {state?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{state.message}</p> : null}

      {state?.matches && state.matches.length > 0 ? (
        <form action={confirm} className="space-y-4">
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card text-sm">
            {state.matches.map((m) => (
              <li key={m.orderId}>
                <label className="flex cursor-pointer items-start gap-4 px-6 py-4">
                  <input type="checkbox" name="order" value={m.orderId} defaultChecked={m.exact} className="mt-1 size-4 accent-[#a9833d]" />
                  <span className="flex-1">
                    <span className="block font-medium">{m.customer}, {m.course}</span>
                    <span className="block text-muted">Comanda {m.ref}. Așteptat {formatPrice(m.expectedCents, m.currency)}, găsit în extras: {m.foundAmount ?? "nicio sumă"}.</span>
                    {!m.exact ? <span className="mt-1 block font-medium text-red-700">Suma nu se potrivește. Verifică înainte de a confirma.</span> : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">{state.unmatchedRows ?? 0} rânduri din extras nu au o comandă corespunzătoare și au fost ignorate.</p>
          <Button type="submit" variant="gold" disabled={confirming}>{confirming ? "Se marchează..." : "Marchează plătite selectate"}</Button>
          {done?.message ? <p role="status" className="rounded-xl bg-gold-soft px-4 py-3 text-sm">{done.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
