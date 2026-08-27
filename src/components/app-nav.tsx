"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";

export type AppNavItem = { href: string; label: string; badge?: string | number };

export function AppNav({ title, items }: { title: string; items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label={title}>
      <p className="app-nav__title">{title}</p>
      {items.map((item) => {
        const active =
          item.href === pathname ||
          (item.href !== "/compte" && item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <span>{item.label}</span>
            {item.badge != null && <span className="badge badge--muted">{item.badge}</span>}
          </Link>
        );
      })}
      <form action={logout}>
        <button type="submit">Se déconnecter</button>
      </form>
    </nav>
  );
}
