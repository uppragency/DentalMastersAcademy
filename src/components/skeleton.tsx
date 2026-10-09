/** Pulsing placeholder block used by loading.tsx files. Decorative, hidden from assistive tech. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-line/70 ${className}`} />;
}

/** Wrapper that announces the loading state once. */
export function LoadingRegion({ children, label = "Se încarcă" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
