import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentProfile } from "@/lib/data";

const staffItems = [
  { href: "/admin", label: "Sumar" },
  { href: "/admin/useri", label: "Useri" },
  { href: "/admin/comenzi", label: "Comenzi" },
  { href: "/admin/abandonate", label: "Neplătite" },
  { href: "/admin/prezenta", label: "Prezență" },
  { href: "/admin/emailuri", label: "Emailuri" },
];
const adminItems = [
  { href: "/admin/cursuri", label: "Cursuri" },
  { href: "/admin/coduri", label: "Coduri reducere" },
  { href: "/admin/gold", label: "Program Gold" },
  { href: "/admin/rapoarte", label: "Rapoarte" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/testimoniale", label: "Testimoniale" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/continut", label: "Conținut site" },
  { href: "/admin/lectori", label: "Lectori" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/evenimente", label: "Evenimente" },
  { href: "/admin/asteptare", label: "Listă de așteptare" },
  { href: "/admin/jurnal", label: "Jurnal modificări" },
  { href: "/admin/sistem", label: "Sistem" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/admin");
  if (profile.role !== "admin" && profile.role !== "operator") redirect("/cont");
  const items = profile.role === "admin" ? [...staffItems, ...adminItems] : staffItems;

  return (
    <Container className="py-12">
      <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-line pb-4">
        <nav aria-label="Administrare" className="flex min-w-0 flex-1 gap-2 overflow-x-auto text-sm">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="whitespace-nowrap rounded-full px-4 py-2 text-muted transition-colors hover:bg-card hover:text-foreground">
              {i.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/cauta" role="search" className="w-full sm:w-72">
          <input name="q" type="search" placeholder="Caută email, nume, comandă" aria-label="Căutare în administrare" className="min-h-11 w-full rounded-full border border-line bg-card px-5 text-sm outline-none focus:border-gold" />
        </form>
      </div>
      {children}
    </Container>
  );
}
