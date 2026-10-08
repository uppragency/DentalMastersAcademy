import Link from "next/link";
import { Container } from "@/components/ui";
import { contact } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-0 overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="hairline-gold" />
      <Container className="grid gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-3xl font-medium leading-tight">
            Formare avansată <span className="text-gold-sheen">pentru medici stomatologi.</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            Dental Masters Academy. Hands-on, chirurgie live și un flux complet între clinică și laborator, în grupuri de maximum 20 de participanți.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:col-span-4">
        <nav aria-label="Platformă" className="space-y-3 text-sm text-white/60">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Platformă</p>
          <Link className="block transition-colors hover:text-white" href="/cursuri">Cursuri</Link>
          <Link className="block transition-colors hover:text-white" href="/categorii">Categorii</Link>
          <Link className="block transition-colors hover:text-white" href="/despre">Despre noi</Link>
          <Link className="block transition-colors hover:text-white" href="/testimoniale">Testimoniale</Link>
          <Link className="block transition-colors hover:text-white" href="/cont">Contul meu</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-3 text-sm text-white/60">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Informații</p>
          <Link className="block transition-colors hover:text-white" href="/contact">Contact</Link>
          <Link className="block transition-colors hover:text-white" href="/termeni">Termeni și condiții</Link>
          <Link className="block transition-colors hover:text-white" href="/confidentialitate">Confidențialitate</Link>
          <Link className="block transition-colors hover:text-white" href="/cookies">Cookies</Link>
        </nav>
        </div>
        <div className="space-y-3 text-sm text-white/60 md:col-span-3">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Contact</p>
          <p>{contact.address}</p>
          <a className="block transition-colors hover:text-white" href={contact.phoneHref}>{contact.phone}</a>
          <a className="block break-all transition-colors hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="block transition-colors hover:text-white" href={contact.socialHref} rel="noopener noreferrer" target="_blank">{contact.social}</a>
        </div>
      </Container>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Dental Masters Academy. Toate drepturile rezervate.
      </div>
    </footer>
  );
}
