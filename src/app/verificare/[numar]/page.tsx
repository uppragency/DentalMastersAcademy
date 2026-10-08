import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { formatDateRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verificare adeverință", robots: { index: false } };

export default async function Verify({ params }: { params: Promise<{ numar: string }> }) {
  const { numar } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { p_number: decodeURIComponent(numar).slice(0, 40) });
  const c = data?.[0];
  return (
    <Container className="max-w-xl py-16">
      {c ? (
        <div className="rounded-[2rem] border border-line bg-card p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Adeverință validă</p>
          <h1 className="font-display mt-3 text-3xl">{c.holder_name}</h1>
          <p className="mt-4 text-muted">a participat la cursul</p>
          <p className="font-display mt-1 text-2xl">{c.course_title}</p>
          <p className="mt-2 text-sm text-muted">{formatDateRange(c.starts_at, c.ends_at)}</p>
          <dl className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Număr</dt><dd className="font-mono">{c.number}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Zile de participare</dt><dd>{c.days_attended}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Emisă la</dt><dd>{new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(new Date(c.issued_at))}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-line bg-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight">Adeverință negăsită</h1>
          <p className="mt-3 text-muted">Numărul introdus nu corespunde niciunei adeverințe emise de noi. Verifică dacă este scris corect.</p>
          <Link href="/verificare" className="mt-5 inline-block text-sm underline underline-offset-4">Încearcă alt număr</Link>
        </div>
      )}
    </Container>
  );
}
