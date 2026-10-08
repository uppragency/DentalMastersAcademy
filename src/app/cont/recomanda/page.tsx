import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getLoyaltySettings } from "@/lib/data";

export const metadata: Metadata = { title: "Recomandă un coleg", robots: { index: false } };

export default async function ReferralPage() {
  const profile = (await getCurrentProfile())!;
  const settings = await getLoyaltySettings();
  const supabase = await createClient();
  const [{ data: me }, { data: rewards }, { count }] = await Promise.all([
    supabase.from("profiles").select("referral_code").eq("id", profile.id).single(),
    supabase.from("discount_codes").select("id, code, value, used_count, max_uses, expires_at").eq("owner_user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("referral_owner", profile.id).eq("status", "paid"),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${site}/r/${me?.referral_code ?? ""}`;
  const friend = Number(settings?.referral_friend_percent ?? 0);
  const reward = Number(settings?.referral_reward_percent ?? 0);

  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cont</p>
      <h1 className="font-display mt-2 text-5xl font-medium">Recomandă un coleg</h1>
      <p className="mt-4 text-muted">
        Colegul tău primește {friend}% reducere la prima achiziție, iar tu primești un cod de {reward}% pentru următorul curs, după ce el plătește.
      </p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-7">
        <p className="text-sm font-medium">Linkul tău</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 break-all rounded-xl bg-background px-4 py-3 text-sm">{link}</code>
          <CopyButton value={link} />
        </div>
        <p className="mt-5 text-sm text-muted">Sau codul tău: <strong className="font-mono text-foreground">{me?.referral_code}</strong></p>
        <p className="mt-2 text-sm text-muted">Recomandări plătite: <strong className="text-foreground">{count ?? 0}</strong></p>
      </div>
      <h2 className="mt-12 text-2xl font-semibold tracking-tight">Codurile tale</h2>
      {(rewards ?? []).length > 0 ? (
        <ul className="mt-5 space-y-3">
          {rewards!.map((r) => {
            const used = r.max_uses !== null && r.used_count >= r.max_uses;
            return (
              <li key={r.id} className={`flex items-center justify-between rounded-3xl border border-line bg-card p-5 ${used ? "opacity-50" : ""}`}>
                <div><p className="font-mono font-semibold">{r.code}</p><p className="text-sm text-muted">{r.value}% reducere{used ? " · folosit" : r.expires_at ? ` · valabil până la ${new Date(r.expires_at).toLocaleDateString("ro-RO")}` : ""}</p></div>
                {!used ? <CopyButton value={r.code} label="Copiază codul" /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">Nu ai încă coduri. Apar aici după prima recomandare plătită.</p>
      )}
    </div>
  );
}
