import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { AccountNav } from "@/components/account-nav";
import { Avatar, TierPill } from "@/components/member-badge";
import { Button, ButtonLink, Container } from "@/components/ui";
import { ThemeSync } from "@/components/theme-sync";
import { getCurrentProfile, getLoyaltySettings, getLoyaltyState } from "@/lib/data";
import { tierProgress, tierNames } from "@/lib/loyalty";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/cont");
  const name = profile.full_name ?? profile.email;
  const settings = await getLoyaltySettings();
  const state = await getLoyaltyState(profile.id, settings);
  const progress = tierProgress(profile.tier, settings, state.spentCents, state.courses);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-background">
      <ThemeSync theme={profile.theme} />
      <Container className="py-6 sm:py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className={`relative overflow-hidden rounded-[2rem] p-6 ${profile.tier === "platinum" ? "bg-gradient-to-br from-[#10131a] to-[#2a3140] text-white" : profile.tier === "gold" ? "bg-gradient-to-br from-[#14100a] to-[#2e220d] text-white" : "bg-ink text-white"}`}>
              <div aria-hidden="true" className="absolute -right-10 -top-10 size-40 rounded-full bg-gold-bright/20 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <Avatar name={name} tier={profile.tier} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="truncate text-xs text-white/55">{profile.specialization ?? profile.email}</p>
                </div>
              </div>
              <div className="relative mt-5"><TierPill tier={profile.tier} /></div>
              {progress.next ? (
                <div className="relative mt-5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progres către ${tierNames[progress.next]}`}>
                    <div className="h-full rounded-full bg-gold-bright" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/60">{progress.percent}% spre {tierNames[progress.next]}{progress.missing ? `, mai ai ${progress.missing}` : ""}</p>
                </div>
              ) : profile.tier === "platinum" ? <p className="relative mt-4 text-xs text-white/60">Nivelul maxim</p> : null}
            </div>
            <div className="mt-4"><AccountNav /></div>
            <div className="mt-4 hidden gap-2 lg:flex lg:flex-col">
              {profile.role === "admin" ? <ButtonLink href="/admin" variant="ghost" className="w-full">Administrare</ButtonLink> : null}
              <form action={logout}><Button type="submit" variant="ghost" className="w-full">Ieși din cont</Button></form>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
