"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";

type Props = {
  user: { firstname: string; role: Role } | null;
};

/** Navigation principale — 4 liens publics + 1 accès espace personnel. */
const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/evenements", label: "Événements & Spots" },
  { href: "/usc", label: "USC" },
  { href: "/adhesion", label: "À propos & Adhésion" },
];

export function SiteHeader({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ferme le menu à chaque navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Ferme sur Échap + repasse en desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 801px)");
    const onChange = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const accountHref = user ? (user.role === "admin" ? "/admin" : "/compte") : "/login";
  const accountLabel = user ? `${user.firstname} — Mon espace` : "Se connecter";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          Deux saisons<span>de planche</span>
        </Link>

        <nav
          className="nav"
          data-nav
          data-open={open ? "true" : "false"}
          aria-label="Navigation principale"
        >
          <button
            className="nav__toggle"
            type="button"
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              className="icon-open"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <svg
              className="icon-close"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <ul className="nav__list" id="primary-nav">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  className="nav__link"
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="nav__link nav__cta"
                href={accountHref}
                aria-current={
                  pathname.startsWith("/compte") || pathname.startsWith("/admin")
                    ? "page"
                    : undefined
                }
              >
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
