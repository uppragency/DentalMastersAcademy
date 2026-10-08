import type { Tier } from "@/lib/types";

export function Avatar({ name, tier, size = 64 }: { name: string; tier: Tier; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const gold = tier === "gold";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${
        gold ? "bg-ink text-[#d9b873] ring-2 ring-gold ring-offset-2 ring-offset-background" : "bg-line text-foreground"
      }`}
    >
      {initials || "DM"}
    </span>
  );
}

export function TierPill({ tier }: { tier: Tier }) {
  return tier === "gold" ? (
    <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white">Gold</span>
  ) : (
    <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">Standard</span>
  );
}
