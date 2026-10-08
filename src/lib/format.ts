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
