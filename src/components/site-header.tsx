import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getCourses, getUnreadCount } from "@/lib/data";
import { formatDateRange, formatPrice, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { MainNav } from "@/components/main-nav";
import { MobileMenu } from "@/components/mobile-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const [unread, categories, courses] = await Promise.all([userId ? getUnreadCount(userId) : Promise.resolve(0), getCategories(), getCourses()]);
  const now = nowMs();
  const navData = {
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    courses: courses.filter((c) => !isEnded(c, now)).slice(0, 4).map((c) => ({ title: c.title, slug: c.slug, date: formatDateRange(c.starts_at, c.ends_at), price: formatPrice(c.price_cents, c.currency) })),
  };
  const mobileItems = [
    { href: "/cursuri", label: "Cursuri", children: [{ href: "/cursuri", label: "Toate cursurile" }, ...categories.map((c) => ({ href: `/cursuri?categorie=${c.slug}`, label: c.name }))] },
    { href: "/despre", label: "Despre noi", children: [{ href: "/lectori", label: "Lectori" }, { href: "/despre#concept", label: "Concept" }, { href: "/testimoniale", label: "Testimoniale" }] },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-white lg:bg-ink/85 lg:backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-12 2xl:px-16">
        <Link href="/" className="flex items-center gap-3" aria-label="Dental Masters Academy, prima pagină">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-bright to-gold font-display text-lg font-semibold text-ink">D</span>
          <span className="text-[15px] font-semibold leading-none tracking-tight">
            Dental Masters<span className="block pt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-gold-bright">Academy</span>
          </span>
        </Link>

        <MainNav data={navData} />

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
          <MobileMenu items={mobileItems} signedIn={Boolean(userId)} />
        </div>
      </div>
    </header>
  );
}
