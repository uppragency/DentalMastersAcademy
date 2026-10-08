import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "group/btn relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium tracking-tight transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variants = {
  primary: "bg-ink text-white hover:bg-ink-2 hover:shadow-[0_10px_30px_-10px_rgba(8,13,23,.6)]",
  gold: "bg-gold text-white hover:bg-[#8f6d2f] hover:shadow-[0_10px_30px_-10px_rgba(169,131,61,.7)]",
  ghost: "border border-line bg-card text-foreground hover:border-foreground/30",
  light: "bg-white text-ink hover:bg-gold-soft",
  outline: "border border-white/25 text-white hover:bg-white/10",
} as const;

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] ${light ? "text-gold-bright" : "text-gold"}`}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
      {children}
    </p>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  lead,
  light = false,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className={center ? "flex justify-center" : ""}><Eyebrow light={light}>{eyebrow}</Eyebrow></div>
      <h2 className={`font-display mt-5 text-balance text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl ${light ? "text-white" : ""}`}>{title}</h2>
      {lead ? <p className={`mt-6 text-pretty text-lg leading-relaxed ${light ? "text-white/65" : "text-muted"}`}>{lead}</p> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base outline-none transition-colors focus:border-gold"
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 transition-transform duration-300 group-hover/btn:translate-x-1 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}
