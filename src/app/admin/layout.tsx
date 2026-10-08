import { redirect } from "next/navigation";
import { AdminNav, type NavGroup } from "@/components/admin-nav";
import { Container } from "@/components/ui";
import { getCurrentProfile } from "@/lib/data";

const staffGroup: NavGroup = {
  label: "Operațiuni",
  items: [
    { href: "/admin", label: "Sumar" },
    { href: "/admin/useri", label: "Useri" },
    { href: "/admin/comenzi", label: "Comenzi" },
    { href: "/admin/abandonate", label: "Neplătite" },
    { href: "/admin/prezenta", label: "Prezență" },
    { href: "/admin/emailuri", label: "Emailuri" },
  ],
};
const adminGroups: NavGroup[] = [
  {
    label: "Catalog",
    items: [
      { href: "/admin/cursuri", label: "Cursuri" },
      { href: "/admin/coduri", label: "Coduri reducere" },
      { href: "/admin/gold", label: "Program Gold" },
      { href: "/admin/asteptare", label: "Listă de așteptare" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/rapoarte", label: "Rapoarte" },
      { href: "/admin/email", label: "Email" },
    ],
  },
  {
    label: "Conținut",
    items: [
      { href: "/admin/testimoniale", label: "Testimoniale" },
      { href: "/admin/feedback", label: "Feedback" },
      { href: "/admin/continut", label: "Conținut site" },
      { href: "/admin/lectori", label: "Lectori" },
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/evenimente", label: "Evenimente" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/jurnal", label: "Jurnal modificări" },
      { href: "/admin/sistem", label: "Sistem" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/autentificare?next=/admin");
  if (profile.role !== "admin" && profile.role !== "operator") redirect("/cont");
  const groups = profile.role === "admin" ? [staffGroup, ...adminGroups] : [staffGroup];

  return (
    <Container className="py-8 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <AdminNav groups={groups} />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
