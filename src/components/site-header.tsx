import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/data";
import { MobileMenu } from "@/components/mobile-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export const navItems = [
  { href: "/cursuri", label: "Cursuri" },
  { href: "/lectori", label: "Lectori" },
  { href: "/blog", label: "Blog" },
  { href: "/despre", label: "Despre noi" },
  { href: "/testimoniale", label: "Testimoniale" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const unread = userId ? await getUnreadCount(userId) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Dental Masters Academy, prima pagină">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-bright to-gold font-display text-lg font-semibold text-ink">D</span>
          <span className="text-[15px] font-semibold leading-none tracking-tight">
            Dental Masters<span className="block pt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-gold-bright">Academy</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-9 text-sm text-white/70 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
          {userId ? <NotificationBell key={unread} unread={unread} /> : null}
          <Link
            href={userId ? "/cont" : "/autentificare"}
            className="hidden min-h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-gold-soft sm:inline-flex"
          >
            {userId ? "Contul meu" : "Intră în cont"}
          </Link>
          <MobileMenu items={navItems} signedIn={Boolean(userId)} />
        </div>
      </div>
    </header>
  );
}
