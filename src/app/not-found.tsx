import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section wrap" style={{ minHeight: "50vh" }}>
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h-xl" style={{ marginTop: ".5rem" }}>
        Page introuvable
      </h1>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Cette page a pris un mauvais bail. Retour à la maison.
      </p>
      <div style={{ marginTop: "2rem" }}>
        <Link className="btn" href="/">
          Retour à l'accueil <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
