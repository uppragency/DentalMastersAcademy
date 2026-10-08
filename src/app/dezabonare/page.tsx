import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { validUnsubToken } from "@/lib/unsub";

export const metadata: Metadata = { title: "Dezabonare", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ u?: string; t?: string }> }) {
  const { u, t } = await searchParams;
  let ok = false;
  if (u && t && UUID.test(u) && validUnsubToken(u, t)) {
    const { error } = await createAdminClient().from("profiles").update({ marketing_opt_out: true }).eq("id", u);
    ok = !error;
  }
  return (
    <Container className="max-w-xl py-24 text-center">
      <h1 className="font-display text-4xl font-medium">{ok ? "Te-ai dezabonat" : "Link invalid"}</h1>
      <p className="mt-4 text-muted">
        {ok ? "Nu vei mai primi emailuri cu recomandări de cursuri. Vei primi în continuare mesajele despre comenzile și cursurile tale." : "Linkul de dezabonare nu este valid sau a expirat. Scrie-ne și te dezabonăm manual."}
      </p>
    </Container>
  );
}
