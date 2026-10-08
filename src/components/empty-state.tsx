import { ButtonLink } from "@/components/ui";

/** Friendly empty state with a next step. */
export function EmptyState({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-line px-6 py-14 text-center">
      <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-soft text-gold">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.5 5.500 6 .700-4.500 4 1.300 6L12 16.300 6.700 19.200 8 13.200 3.500 9.200l6-.700z" /></svg>
      </span>
      <p className="mt-5 text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
      {href && cta ? <ButtonLink href={href} className="mt-6">{cta}</ButtonLink> : null}
    </div>
  );
}
