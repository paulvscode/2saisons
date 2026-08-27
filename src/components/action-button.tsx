"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/action-types";

/** Bouton qui déclenche une server action (id -> résultat) avec état de chargement. */
export function ActionButton({
  action,
  id,
  children,
  pendingLabel = "…",
  className = "btn btn--sm",
  confirm,
}: {
  action: (id: string) => Promise<FormState>;
  id: string;
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-actions">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const res = await action(id);
            setMsg(res.message ?? null);
          });
        }}
      >
        {pending ? pendingLabel : children}
      </button>
      {msg && (
        <span className="field__hint" role="status">
          {msg}
        </span>
      )}
    </span>
  );
}
