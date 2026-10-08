export function Seats({ taken, capacity, dark = false }: { taken: number; capacity: number | null; dark?: boolean }) {
  if (!capacity) return null;
  const t = Math.min(taken, capacity);
  const left = capacity - t;
  const pct = Math.round((t / capacity) * 100);
  return (
    <div className={dark ? "text-white/80" : "text-muted"}>
      <div className="flex items-center justify-between text-xs">
        <span>{left === 0 ? "Locuri epuizate" : `${t} din ${capacity} locuri ocupate`}</span>
        {left > 0 && left <= 5 ? <span className="font-semibold text-gold">Ultimele {left} locuri</span> : null}
      </div>
      <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-line"}`} role="progressbar" aria-valuenow={t} aria-valuemin={0} aria-valuemax={capacity} aria-label="Locuri ocupate">
        <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
