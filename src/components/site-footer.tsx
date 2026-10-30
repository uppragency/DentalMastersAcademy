import { tr } from "@/lib/i18n/server";
import Link from "@/components/locale-link";
import { Container } from "@/components/ui";
import { contact } from "@/content/site";
import { LanguageSwitch } from "@/components/language-switch";

export function SiteFooter() {
  return (
    <footer className="relative mt-0 overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="hairline-gold" />
      <Container className="grid gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-3xl font-medium leading-tight">
            {tr("Formare avansată")}{" "}<span className="text-gold-sheen">{tr("pentru medici stomatologi.")}</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            {tr("Dental Masters Academy. Hands-on, chirurgie live și un flux complet între clinică și laborator, în grupuri restrânse.")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:col-span-4">
        <nav aria-label={tr("Platformă")} className="space-y-3 text-sm text-white/60">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">{tr("Platformă")}</p>
          <Link className="block transition-colors hover:text-white" href="/cursuri">{tr("Cursuri")}</Link>
          <Link className="block transition-colors hover:text-white" href="/cine-suntem">{tr("Cine suntem")}</Link>
          <Link className="block transition-colors hover:text-white" href="/lectori">{tr("Lectorii noștri")}</Link>
          <Link className="block transition-colors hover:text-white" href="/parteneri">{tr("Partenerii noștri")}</Link>
          <Link className="block transition-colors hover:text-white" href="/mentorat">{tr("Mentorat clinic")}</Link>
          <Link className="block transition-colors hover:text-white" href="/evenimente">{tr("Evenimente")}</Link>
          <Link className="block transition-colors hover:text-white" href="/testimoniale">{tr("Testimoniale")}</Link>
          <Link className="block transition-colors hover:text-white" href="/cont">{tr("Contul meu")}</Link>
        </nav>
        <nav aria-label={tr("Legal")} className="space-y-3 text-sm text-white/60">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">{tr("Informații")}</p>
          <Link className="block transition-colors hover:text-white" href="/contact">{tr("Contact")}</Link>
          <Link className="block transition-colors hover:text-white" href="/termeni">{tr("Termeni și condiții")}</Link>
          <Link className="block transition-colors hover:text-white" href="/confidentialitate">{tr("Confidențialitate")}</Link>
          <Link className="block transition-colors hover:text-white" href="/rambursare">{tr("Rambursare și transfer")}</Link>
          <Link className="block transition-colors hover:text-white" href="/cookies">{tr("Cookies")}</Link>
        </nav>
        </div>
        <div className="space-y-3 text-sm text-white/60 md:col-span-3">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">{tr("Contact")}</p>
          <p>{contact.address}</p>
          <a className="block transition-colors hover:text-white" href={contact.phoneHref}>{contact.phone}</a>
          <a className="block break-all transition-colors hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="block transition-colors hover:text-white" href={contact.socialHref} rel="noopener noreferrer" target="_blank">{contact.social}</a>
        </div>
      </Container>
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-xs text-white/40 sm:flex-row sm:px-8 lg:px-12">
        <span>© {new Date().getFullYear()} {" "}{tr("Dental Masters Academy. Toate drepturile rezervate.")}</span>
        <LanguageSwitch variant="footer" />
      </div>
    </footer>
  );
}
