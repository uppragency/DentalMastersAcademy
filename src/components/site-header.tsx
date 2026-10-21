import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getCourses, getCurrentProfile, getTrainers, getUnreadCount } from "@/lib/data";
import { AccountMenu } from "@/components/account-menu";
import { tierNames } from "@/lib/loyalty";
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
  const [unread, categories, courses, profile, trainers] = await Promise.all([userId ? getUnreadCount(userId) : Promise.resolve(0), getCategories(), getCourses(), userId ? getCurrentProfile() : Promise.resolve(null), getTrainers()]);
  const now = nowMs();
  const navData = {
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    founders: trainers.filter((t) => t.is_founder).map((t) => ({ name: t.name, slug: t.slug })),
    courses: courses.filter((c) => !isEnded(c, now)).slice(0, 4).map((c) => ({ title: c.title, slug: c.slug, date: formatDateRange(c.starts_at, c.ends_at), price: formatPrice(c.price_cents, c.currency) })),
  };
  const mobileItems = [
    { href: "/cursuri", label: "Cursuri și workshopuri", children: [{ href: "/cursuri", label: "Toate cursurile" }, { href: "/cursuri#dma", label: "Cursuri DMA" }, { href: "/cursuri#hosted", label: "Cursuri găzduite" }, { href: "/mentorat", label: "Mentorat clinic" }, ...categories.map((c) => ({ href: `/cursuri?categorie=${c.slug}`, label: c.name }))] },
    { href: "/cine-suntem", label: "Cine suntem", children: [{ href: "/cine-suntem", label: "Conceptul DMA" }, ...trainers.filter((t) => t.is_founder).map((t) => ({ href: `/lectori/${t.slug}`, label: t.name })), { href: "/lectori", label: "Lectorii noștri" }, { href: "/parteneri", label: "Partenerii noștri" }] },
    { href: "/testimoniale", label: "Testimoniale" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-white lg:bg-ink/85 lg:backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-12 2xl:px-16">
        <Link href="/" className="flex items-center" aria-label="Dental Masters Academy, prima pagină">
          <Image src="/logo.png" alt="" width={795} height={377} priority className="h-14 w-auto" />
        </Link>

        <MainNav data={navData} />

        <div className="flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
          {userId ? <NotificationBell key={unread} unread={unread} /> : null}
          {profile ? (
            <AccountMenu name={profile.full_name || profile.email} tier={profile.tier} tierLabel={tierNames[profile.tier]} />
          ) : (
            <Link href="/autentificare" className="hidden min-h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-gold-soft sm:inline-flex">Intră în cont</Link>
          )}
          <MobileMenu items={mobileItems} signedIn={Boolean(userId)} />
        </div>
      </div>
    </header>
  );
}
