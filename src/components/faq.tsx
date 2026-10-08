export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-lg font-medium tracking-tight [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-line transition-colors group-open:bg-ink group-open:text-white">
              <span className="absolute h-px w-3.5 bg-current" />
              <span className="absolute h-3.5 w-px bg-current transition-transform duration-300 group-open:rotate-90" />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
