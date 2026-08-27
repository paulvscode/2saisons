"use client";

import { useState } from "react";

export function Disclosure({
  label,
  openLabel,
  children,
  className = "link-btn",
}: {
  label: string;
  openLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen((v) => !v)}>
        {open ? openLabel ?? "Fermer" : label}
      </button>
      {open && <div style={{ marginTop: "var(--space-s)" }}>{children}</div>}
    </>
  );
}
