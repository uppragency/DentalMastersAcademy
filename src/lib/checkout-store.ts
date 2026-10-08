/** Tiny external store: the order summary (client) publishes the live total, the submit button reads it. */
type Totals = { total: number; savings: number; currency: string; free: boolean } | null;

let state: Totals = null;
const listeners = new Set<() => void>();

export const checkoutTotals = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  publish(next: Totals) {
    if (state && next && state.total === next.total && state.savings === next.savings && state.currency === next.currency && state.free === next.free) return;
    state = next;
    listeners.forEach((l) => l());
  },
};
