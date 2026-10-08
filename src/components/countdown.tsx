"use client";

import { useEffect, useState } from "react";

function parts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    done: diff === 0,
  };
}

export function Countdown({ to, label = "Timp rămas până la deschiderea înscrierilor" }: { to: string; label?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const p = now === null ? null : parts(target, now);
  const cells: [string, number | null][] = [["zile", p?.d ?? null], ["ore", p?.h ?? null], ["min", p?.m ?? null], ["sec", p?.s ?? null]];
  return (
    <div role="timer" aria-label={label} className="grid grid-cols-4 gap-2 text-center">
      {cells.map(([label, v]) => (
        <div key={label} className="rounded-2xl border border-line bg-background px-2 py-3">
          <div className="font-display text-3xl tabular-nums">{v === null ? "--" : String(v).padStart(2, "0")}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
