"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/cont", label: "Prezentare", exact: true },
  { href: "/cont/program", label: "Program Gold" },
  { href: "/cont/cursuri", label: "Cursurile mele" },
  { href: "/cont/comenzi", label: "Comenzi" },
  { href: "/cont/recomanda", label: "Recomandă un coleg" },
  { href: "/cont/profil", label: "Profil și securitate" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Cont" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
              active ? "bg-ink text-white shadow-lg shadow-ink/20" : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
