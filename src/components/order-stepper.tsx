import { formatDate } from "@/lib/format";
import { formatDeadline } from "@/lib/transfer";

type State = "done" | "current" | "todo" | "failed";
type Step = { label: string; note?: string; state: State };

/** Four steps of an order: placed, payment received, enrolled, invoice issued. Cancelled and refunded orders end differently. */
export function OrderStepper({
  status,
  source,
  createdAt,
  paidAt,
  expiresAt,
  invoiceNumber,
}: {
  status: string;
  source: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
  invoiceNumber: string | null;
}) {
  const paid = status === "paid" || status === "refunded";
  const dead = status === "cancelled" || status === "failed";
  const transfer = source === "transfer";

  const steps: Step[] = [
    { label: "Comandă plasată", note: formatDate(createdAt), state: "done" },
    {
      label: dead ? (status === "failed" ? "Plata a eșuat" : "Comandă anulată") : "Plată primită",
      note: paid && paidAt ? formatDate(paidAt) : dead ? undefined : transfer && expiresAt ? `Așteptăm transferul până ${formatDeadline(expiresAt)}` : "Așteptăm confirmarea plății",
      state: paid ? "done" : dead ? "failed" : "current",
    },
    { label: "Înscriere activată", note: paid && paidAt ? formatDate(paidAt) : undefined, state: paid ? "done" : "todo" },
    {
      label: "Factură emisă",
      note: invoiceNumber ?? (paid ? "Se emite în curând" : undefined),
      state: invoiceNumber ? "done" : paid ? "current" : "todo",
    },
  ];
  if (status === "refunded") steps.push({ label: "Rambursată", state: "done" });

  const dot: Record<State, string> = {
    done: "border-gold bg-gold text-white",
    current: "border-gold bg-background text-gold",
    todo: "border-line bg-background text-muted",
    failed: "border-red-700 bg-red-700 text-white",
  };

  return (
    <nav aria-label="Stadiul comenzii" className="mt-8 rounded-[2rem] border border-line bg-card p-6 sm:p-8 print:hidden">
      <ol className={`grid gap-5 ${steps.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
        {steps.map((s, i) => (
          <li key={s.label} aria-current={s.state === "current" ? "step" : undefined} className="relative flex gap-4 sm:block">
            {i < steps.length - 1 ? (
              <>
                <span aria-hidden="true" className={`absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px sm:hidden ${s.state === "done" ? "bg-gold" : "bg-line"}`} />
                <span aria-hidden="true" className={`absolute left-9 top-[15px] hidden h-px w-[calc(100%-1.5rem)] sm:block ${s.state === "done" ? "bg-gold" : "bg-line"}`} />
              </>
            ) : null}
            <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${dot[s.state]}`}>
              {s.state === "done" ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
              ) : s.state === "failed" ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="block sm:mt-3">
              <span className={`block text-sm font-semibold ${s.state === "todo" ? "text-muted" : ""} ${s.state === "failed" ? "text-red-700" : ""}`}>{s.label}</span>
              {s.note ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{s.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
