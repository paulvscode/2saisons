"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section wrap" style={{ minHeight: "50vh" }}>
      <p className="eyebrow">Erreur</p>
      <h1 className="h-xl" style={{ marginTop: ".5rem" }}>
        Une erreur est survenue
      </h1>
      <p className="muted" style={{ marginTop: "1rem" }}>
        {error.message || "Erreur inattendue."}
      </p>
      {error.digest && <p className="field__hint">digest : {error.digest}</p>}
      <div style={{ marginTop: "2rem" }} className="inline-actions">
        <button className="btn" type="button" onClick={reset}>
          Réessayer
        </button>
      </div>
    </section>
  );
}
