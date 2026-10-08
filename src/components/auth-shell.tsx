import type { ReactNode } from "react";
import { CourseArt } from "@/components/course-art";

const perks = ["Cursurile plătite, într-un singur loc", "Istoric al comenzilor și notificări", "Reducere automată cu statusul Gold"];

export function AuthShell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-72px)] lg:grid-cols-2">
      <aside className="grain relative hidden overflow-hidden bg-ink text-white lg:block">
        <CourseArt seed="auth" className="absolute inset-0 size-full scale-125 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="relative flex h-full flex-col justify-end p-16">
          <p className="font-display max-w-md text-5xl leading-[1.05]">Învățarea ta, <span className="text-gold-sheen">la un clic distanță.</span></p>
          <ul className="mt-10 space-y-3 text-white/70">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3"><span className="size-1.5 rotate-45 bg-gold-bright" />{p}</li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-5xl font-medium">{title}</h1>
          <p className="mt-3 text-muted">{lead}</p>
          <div className="mt-10 rounded-[2rem] border border-line bg-card p-8 shadow-[0_30px_60px_-40px_rgba(8,13,23,.35)]">{children}</div>
        </div>
      </div>
    </div>
  );
}
