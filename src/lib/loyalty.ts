import type { LoyaltySettings, Tier } from "@/lib/types";

export const tierNames: Record<Tier, string> = { standard: "Standard", gold: "Gold", platinum: "Platinum" };

export type TierPerks = {
  name: string;
  member: boolean;
  discountPercent: number;
  multiplier: number;
  capPercent: number;
  earlyMs: number;
};

/** Benefits of a tier. When the program is off, everyone is treated as Standard without a discount. */
export function tierPerks(tier: Tier, s: LoyaltySettings | null): TierPerks {
  const on = Boolean(s?.is_active);
  const t: Tier = on ? tier : "standard";
  const n = (v: number | string | null | undefined, d: number) => (v === null || v === undefined ? d : Number(v));
  const discountPercent = !s || !on ? 0 : t === "platinum" ? n(s.platinum_discount_percent, 0) : t === "gold" ? n(s.gold_discount_percent, 0) : 0;
  const multiplier = !s ? 1 : t === "platinum" ? n(s.points_multiplier_platinum, 2) : t === "gold" ? n(s.points_multiplier_gold, 1.5) : n(s.points_multiplier_standard, 1);
  const capPercent = !s ? 0 : t === "platinum" ? n(s.points_cap_platinum, 30) : t === "gold" ? n(s.points_cap_gold, 20) : n(s.points_cap_standard, 10);
  const member = on && t !== "standard";
  return { name: tierNames[t], member, discountPercent, multiplier, capPercent, earlyMs: member ? n(s?.early_access_hours, 48) * 3_600_000 : 0 };
}
