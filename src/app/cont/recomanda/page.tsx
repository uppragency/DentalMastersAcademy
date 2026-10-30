import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getLoyaltySettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Recomandă un coleg"), robots: { index: false } };
}

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
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{tr("Cont")}</p>
      <h1 className="font-display mt-2 text-5xl font-medium">{tr("Recomandă un coleg")}</h1>
      <p className="mt-4 max-w-3xl text-muted">
        {tr("Colegul tău primește")}{" "}{friend}{tr("% reducere la prima achiziție, iar tu primești un cod de")}{" "}{reward}{tr("% pentru următorul curs, după ce el plătește.")}</p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-7">
        <p className="text-sm font-medium">{tr("Linkul tău")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 break-all rounded-xl bg-background px-4 py-3 text-sm">{link}</code>
          <CopyButton value={link} />
        </div>
        <p className="mt-5 text-sm text-muted">{tr("Sau codul tău:")}{" "}<strong className="font-mono text-foreground">{me?.referral_code}</strong></p>
        <a
          href={tr("https://wa.me/?text={v1}", { v1: encodeURIComponent(tr("Îți recomand cursurile Dental Masters Academy. Cu linkul meu primești {friend}% reducere la prima achiziție: {link}", { friend: friend, link: link })) })}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#1f8f4e] px-5 text-sm font-medium text-white"
        >
          {tr("Trimite pe WhatsApp")}</a>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">{tr("Recomandări plătite")}</dt><dd className="font-display mt-2 text-4xl">{count ?? 0}</dd></div>
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">{tr("Coduri câștigate")}</dt><dd className="font-display mt-2 text-4xl">{(rewards ?? []).length}</dd></div>
        <div className="rounded-3xl border border-line bg-card p-6"><dt className="text-sm text-muted">{tr("Coduri disponibile")}</dt><dd className="font-display mt-2 text-4xl">{(rewards ?? []).filter((r) => !(r.max_uses !== null && r.used_count >= r.max_uses)).length}</dd></div>
      </dl>
      <h2 className="mt-12 text-2xl font-semibold tracking-tight">{tr("Codurile tale")}</h2>
      {(rewards ?? []).length > 0 ? (
        <ul className="mt-5 space-y-3">
          {rewards!.map((r) => {
            const used = r.max_uses !== null && r.used_count >= r.max_uses;
            return (
              <li key={r.id} className={`flex items-center justify-between rounded-3xl border border-line bg-card p-5 ${used ? "opacity-50" : ""}`}>
                <div><p className="font-mono font-semibold">{r.code}</p><p className="text-sm text-muted">{r.value}{tr("% reducere")}{used ? " · folosit" : r.expires_at ? tr(" · valabil până la {v1}", { v1: new Date(r.expires_at).toLocaleDateString("ro-RO") }) : ""}</p></div>
                {!used ? <CopyButton value={r.code} label={tr("Copiază codul")} /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">{tr("Nu ai încă coduri. Apar aici după prima recomandare plătită.")}</p>
      )}
    </div>
  );
}
