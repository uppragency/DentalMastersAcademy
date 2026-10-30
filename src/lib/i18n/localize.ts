import "server-only";
import { loc } from "./server";

type Tr = { translations?: Record<string, Record<string, unknown>> | null };

const filled = (v: unknown) =>
  v != null && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && v.length === 0);

/** Overlays the English translation of a database row (translations.en) on the Romanian columns. Empty values fall back to Romanian. */
export function localize<T extends object>(row: T): T {
  if (loc() !== "en") return row;
  const en = (row as Tr).translations?.en;
  if (!en || typeof en !== "object") return row;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(en)) if (filled(v)) patch[k] = v;
  return { ...row, ...patch };
}

export function localizeAll<T extends object>(rows: T[]): T[] {
  return loc() === "en" ? rows.map(localize) : rows;
}
