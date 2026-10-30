import { tr } from "@/lib/i18n/server";
import Image from "next/image";
import Link from "@/components/locale-link";
import { createClient } from "@/lib/supabase/server";
import { getCourses, getCurrentProfile, getTrainers, getUnreadCount } from "@/lib/data";
import { AccountMenu } from "@/components/account-menu";
import { tierNames } from "@/lib/loyalty";
import { formatDateRange, isEnded } from "@/lib/format";
import { nowMs } from "@/lib/time";
import { MainNav } from "@/components/main-nav";
import { MobileMenu } from "@/components/mobile-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitch } from "@/components/language-switch";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const [unread, courses, profile, trainers] = await Promise.all([userId ? getUnreadCount(userId) : Promise.resolve(0), getCourses(), userId ? getCurrentProfile() : Promise.resolve(null), getTrainers()]);
  const now = nowMs();
  const line = (c: (typeof courses)[number]) => (c.starts_at ? formatDateRange(c.starts_at, c.ends_at) : tr("Data va fi anunțată"));
  const hostedLine = (c: (typeof courses)[number]) => [c.trainer_name, c.powered_by ? `powered by ${c.powered_by}` : null].filter(Boolean).join(" · ");
  const open = courses.filter((c) => !isEnded(c, now));
  const navData = {
    founders: trainers.filter((t) => t.is_founder).map((t) => ({ name: t.name, slug: t.slug })),
    faculty: trainers.filter((t) => !t.is_founder).map((t) => ({ name: t.name, slug: t.slug })),
    dma: open.filter((c) => c.kind !== "hosted").map((c) => ({ title: c.title, slug: c.slug, line: line(c) })),
    hosted: open.filter((c) => c.kind === "hosted").map((c) => ({ title: c.title, slug: c.slug, line: hostedLine(c) || line(c) })),
  };
  const faculty = trainers.filter((t) => !t.is_founder);
  const mobileItems = [
    { href: "/cine-suntem", label: tr("Cine suntem"), children: [{ href: "/cine-suntem", label: tr("Conceptul DMA") }, ...trainers.filter((t) => t.is_founder).map((t) => ({ href: `/lectori/${t.slug}`, label: t.name })), { href: "/lectori", label: tr("Lectorii noștri") }, ...faculty.map((t) => ({ href: `/lectori/${t.slug}`, label: t.name })), { href: "/parteneri", label: tr("Partenerii noștri") }] },
    { href: "/cursuri", label: tr("Cursuri și workshopuri"), children: [...navData.dma.map((c) => ({ href: `/cursuri/${c.slug}`, label: c.title })), ...navData.hosted.map((c) => ({ href: `/cursuri/${c.slug}`, label: c.title })), { href: "/mentorat", label: tr("Mentorat clinic") }] },
    { href: "/testimoniale", label: tr("Testimoniale"), children: [{ href: "/testimoniale#t-foto", label: tr("Galerii foto") }, { href: "/testimoniale#t-text", label: tr("Testimoniale text") }, { href: "/testimoniale#t-video", label: tr("Testimoniale video") }] },
    { href: "/contact", label: tr("Contact"), children: [{ href: "/contact#medici", label: tr("Pentru medici") }, { href: "/contact#pacienti", label: tr("Pentru pacienți") }] },
    { href: "/blog", label: tr("Blog") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-white lg:bg-ink/85 lg:backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-12 2xl:px-16">
        <Link href="/" className="flex items-center" aria-label={tr("Dental Masters Academy, prima pagină")}>
          <Image src="/logo.png" alt="" width={795} height={377} priority className="h-14 w-auto" />
        </Link>

        <MainNav data={navData} />

        <div className="flex items-center gap-2">
          <Link href="/contact#medici" className="hidden min-h-11 items-center rounded-full border border-white/25 px-5 text-sm text-white/85 transition-colors hover:border-gold-bright hover:text-white 2xl:inline-flex">{tr("Trimite un caz")}</Link>
          <div className="hidden lg:block"><LanguageSwitch /></div>
          <SearchDialog />
          <ThemeToggle />
          {userId ? <NotificationBell key={unread} unread={unread} /> : null}
          {profile ? (
            <AccountMenu name={profile.full_name || profile.email} tier={profile.tier} tierLabel={tierNames[profile.tier]} />
          ) : (
            <Link href="/autentificare" className="hidden min-h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-gold-soft sm:inline-flex">{tr("Intră în cont")}</Link>
          )}
          <MobileMenu items={mobileItems} signedIn={Boolean(userId)} />
        </div>
      </div>
    </header>
  );
}
