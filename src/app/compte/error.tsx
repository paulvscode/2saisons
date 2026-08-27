"use client";

import { useEffect } from "react";

export default function CompteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur espace membre :", error);
  }, [error]);

  return (
    <div className="app-main" style={{ padding: "var(--space-xl) var(--space-s)", maxWidth: "40rem", margin: "0 auto" }}>
      <p className="eyebrow">Erreur</p>
      <h1 className="h-l" style={{ marginTop: ".5rem" }}>
        Impossible d'afficher cette page
      </h1>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {error.message || "Une erreur inattendue est survenue."}
      </p>
      {error.digest && <p className="field__hint">digest : {error.digest}</p>}
      <div style={{ marginTop: "2rem" }} className="inline-actions">
        <button className="btn btn--sm" type="button" onClick={reset}>
          Réessayer
        </button>
        <a className="btn btn--sm btn--ghost" href="/">
          Accueil
        </a>
      </div>
    </div>
  );
}
