import type { Tier } from "@/lib/types";

export function Avatar({ name, tier, size = 64 }: { name: string; tier: Tier; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const gold = tier !== "standard";
  const plat = tier === "platinum";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={`font-display inline-flex shrink-0 items-center justify-center rounded-full ${
        plat ? "bg-gradient-to-br from-[#e8ecf2] to-[#9aa6b8] text-ink" : gold ? "bg-gradient-to-br from-gold-bright to-gold text-ink" : "bg-white/10 text-white ring-1 ring-white/20"
      }`}
    >
      {initials || "DM"}
    </span>
  );
}

export function TierPill({ tier }: { tier: Tier }) {
  if (tier === "platinum") {
    return <span className="rounded-full bg-gradient-to-r from-[#eef1f6] to-[#a3aec0] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-ink">Platinum</span>;
  }
  return tier === "gold" ? (
    <span className="rounded-full bg-gradient-to-r from-gold-bright to-gold px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-ink">Gold</span>
  ) : (
    <span className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-widest text-white/70">Standard</span>
  );
}
