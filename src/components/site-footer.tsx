import Link from "next/link";
import { Container } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-semibold tracking-tight">
            Dental Masters <span className="text-gold">Academy</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Cursuri de înaltă specializare pentru medicii stomatologi, susținute de formatori cu experiență clinică.
          </p>
        </div>
        <nav aria-label="Platformă" className="space-y-2 text-sm text-muted">
          <p className="mb-3 font-medium text-foreground">Platformă</p>
          <Link className="block hover:text-foreground" href="/cursuri">Cursuri</Link>
          <Link className="block hover:text-foreground" href="/testimoniale">Testimoniale</Link>
          <Link className="block hover:text-foreground" href="/despre">Despre noi</Link>
          <Link className="block hover:text-foreground" href="/cont">Contul meu</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2 text-sm text-muted">
          <p className="mb-3 font-medium text-foreground">Contact și legal</p>
          <Link className="block hover:text-foreground" href="/contact">Contact</Link>
          <Link className="block hover:text-foreground" href="/termeni">Termeni și condiții</Link>
          <Link className="block hover:text-foreground" href="/confidentialitate">Confidențialitate</Link>
        </nav>
      </Container>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Dental Masters Academy. Toate drepturile rezervate.
      </div>
    </footer>
  );
}
