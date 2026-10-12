"use client";

import { useState } from "react";

/** Copie l'URL d'une image (pour l'utiliser dans un événement, par exemple). */
export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="link-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt("URL de l'image :", url);
        }
      }}
    >
      {copied ? "Copiée ✓" : "Copier l'URL"}
    </button>
  );
}
