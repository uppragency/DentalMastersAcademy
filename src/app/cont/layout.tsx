import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { AccountNav } from "@/components/account-nav";
import { Avatar, TierPill } from "@/components/member-badge";
import { Button, ButtonLink, Container } from "@/components/ui";
import { getCurrentProfile } from "@/lib/data";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/cont");
  const name = profile.full_name ?? profile.email;

  return (
    <Container className="py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
            <Avatar name={name} tier={profile.tier} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              <p className="truncate text-xs text-muted">{profile.specialization ?? profile.email}</p>
              <div className="mt-2"><TierPill tier={profile.tier} /></div>
            </div>
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
  );
}
