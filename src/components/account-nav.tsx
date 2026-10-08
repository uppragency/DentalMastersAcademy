"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/cont", label: "Prezentare", exact: true },
  { href: "/cont/cursuri", label: "Cursurile mele" },
  { href: "/cont/comenzi", label: "Comenzi" },
  { href: "/cont/profil", label: "Profil și securitate" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Cont" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              active ? "bg-ink text-white" : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
