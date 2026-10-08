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

const bucharestDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" });

/** Calendar days (YYYY-MM-DD, Bucharest time) a course runs on. A course without an end date runs one day. */
export function courseDays(start: string | null, end: string | null): string[] {
  if (!start) return [];
  const first = bucharestDay.format(new Date(start));
  const last = end ? bucharestDay.format(new Date(end)) : first;
  const days: string[] = [];
  for (let t = Date.parse(first); t <= Date.parse(last) && days.length < 31; t += 86_400_000) days.push(new Date(t).toISOString().slice(0, 10));
  return days.length ? days : [first];
}

/** "YYYY-MM-DDTHH:mm" entered as Europe/Bucharest time to an ISO instant (handles DST). Null when invalid. */
export function bucharestInstant(local: string | undefined | null): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(local ?? "");
  if (!m) return null;
  const hour = Number(m[2]);
  const guess = new Date(`${m[1]}T${m[2]}:${m[3]}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" }).formatToParts(guess);
  let offset = Number(parts.find((p) => p.type === "hour")?.value ?? hour) - hour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;
  return new Date(guess.getTime() - offset * 3_600_000).toISOString();
}

/** ISO instant to the "YYYY-MM-DDTHH:mm" value a datetime-local input expects, in Bucharest time. */
export function toBucharestLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const f = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  return f.replace(" ", "T");
}
