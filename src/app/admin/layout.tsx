import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentProfile } from "@/lib/data";

const items = [
  { href: "/admin", label: "Sumar" },
  { href: "/admin/cursuri", label: "Cursuri" },
  { href: "/admin/comenzi", label: "Comenzi" },
  { href: "/admin/testimoniale", label: "Testimoniale" },
  { href: "/admin/lectori", label: "Lectori" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/evenimente", label: "Evenimente" },
  { href: "/admin/coduri", label: "Coduri reducere" },
  { href: "/admin/asteptare", label: "Listă de așteptare" },
  { href: "/admin/gold", label: "Program Gold și recomandări" },
  { href: "/admin/jurnal", label: "Jurnal modificări" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/admin");
  if (profile.role !== "admin") redirect("/cont");

  return (
    <Container className="py-12">
      <nav aria-label="Administrare" className="mb-10 flex gap-2 overflow-x-auto border-b border-line pb-4 text-sm">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="whitespace-nowrap rounded-full px-4 py-2 text-muted transition-colors hover:bg-card hover:text-foreground">
            {i.label}
          </Link>
        ))}
      </nav>
      {children}
    </Container>
  );
}
