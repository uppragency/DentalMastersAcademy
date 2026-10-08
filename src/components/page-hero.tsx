import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="grain relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
      <div aria-hidden="true" className="drift absolute -right-32 -top-40 -z-10 size-[480px] rounded-full bg-gold/20 blur-[110px]" />
      <Container className="py-20 sm:py-28">
        <div className="rise"><Eyebrow light>{eyebrow}</Eyebrow></div>
        <h1 className="rise font-display mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.02] sm:text-7xl" style={{ ["--d" as string]: "100ms" }}>{title}</h1>
        {lead ? <p className="rise mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60" style={{ ["--d" as string]: "200ms" }}>{lead}</p> : null}
        {children ? <div className="rise mt-10" style={{ ["--d" as string]: "300ms" }}>{children}</div> : null}
      </Container>
    </section>
  );
}
