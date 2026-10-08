export function formatPrice(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(iso: string | null) {
  if (!iso) return "Data se anunță";
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(iso));
}

export const formatLabels = { physical: "Fizic", online: "Online", hybrid: "Hibrid" } as const;

export function formatDateRange(start: string | null, end: string | null) {
  if (!start) return "Data se anunță";
  if (!end) return formatDate(start);
  const f = (d: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("ro-RO", { ...o, timeZone: "Europe/Bucharest" }).format(new Date(d));
  const sameDay = f(start, { dateStyle: "short" }) === f(end, { dateStyle: "short" });
  if (sameDay) return formatDate(start);
  const sameMonth = f(start, { month: "numeric", year: "numeric" }) === f(end, { month: "numeric", year: "numeric" });
  if (sameMonth) return `${f(start, { day: "numeric" })}–${f(end, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function monthShort(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ro-RO", { month: "short", timeZone: "Europe/Bucharest" }).format(new Date(iso)).replace(".", "");
}
export function dayNum(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(iso));
}

export function isEnded(c: { starts_at: string | null; ends_at: string | null }, now: number) {
  const ref = c.ends_at ?? c.starts_at;
  return Boolean(ref && new Date(ref).getTime() < now);
}

export function isNotOpen(c: { registration_opens_at: string | null }, now: number, earlyMs = 0) {
  return Boolean(c.registration_opens_at && new Date(c.registration_opens_at).getTime() > now + earlyMs);
}
