import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui";

const nav = [
  { href: "/cursuri", label: "Cursuri" },
  { href: "/testimoniale", label: "Testimoniale" },
  { href: "/despre", label: "Despre noi" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-[17px] font-semibold tracking-tight">
          Dental Masters <span className="text-gold">Academy</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm text-muted md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={signedIn ? "/cont" : "/autentificare"}
          className="inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          {signedIn ? "Contul meu" : "Intră în cont"}
        </Link>
      </Container>
      <nav aria-label="Principal mobil" className="border-t border-line/70 md:hidden">
        <Container className="flex gap-6 overflow-x-auto py-2.5 text-sm text-muted">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </Container>
      </nav>
    </header>
  );
}
