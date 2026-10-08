import { bucharestInstant } from "@/lib/format";

export const TRANSFER_WORKING_DAYS = 2;
export type PayMethod = "card" | "transfer";

/** Normalizes the per-course setting: only known methods, card by default. */
export function courseMethods(v: string[] | null | undefined): PayMethod[] {
  const m = (v ?? []).filter((x): x is PayMethod => x === "card" || x === "transfer");
  return m.length ? m : ["card"];
}

/**
 * Seat reservation for a bank transfer: 2 working days, until the end of the second day (Bucharest time).
 * Saturday and Sunday do not count, so an order placed on Friday (or over the weekend) is held until Tuesday.
 * Public holidays are not excluded.
 */
export function transferDeadline(from: Date = new Date()): Date {
  const ymd = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
  let day = new Date(`${ymd(from)}T12:00:00Z`);
  let left = TRANSFER_WORKING_DAYS;
  while (left > 0) {
    day = new Date(day.getTime() + 86_400_000);
    const dow = day.getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return new Date(bucharestInstant(`${ymd(day)}T23:59`)!);
}

export function formatDeadline(d: Date | string): string {
  return new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}
