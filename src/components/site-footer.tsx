import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap wrap--wide">
        <div className="site-footer__grid">
          <div>
            <h2>
              Roule
              <br />
              avec nous
            </h2>
            <p className="muted" style={{ marginTop: "1.5rem", maxWidth: "28ch" }}>
              Deux saisons de planche — association pour la pratique et la culture du skateboard.
            </p>
          </div>

          <nav aria-label="Pied de page">
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>
              Site
            </p>
            <ul className="footer-nav">
              <li>
                <Link href="/">Accueil</Link>
              </li>
              <li>
                <Link href="/evenements">Événements &amp; Spots</Link>
              </li>
              <li>
                <Link href="/adhesion">À propos &amp; Adhésion</Link>
              </li>
              <li>
                <Link href="/compte">Espace membre</Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>
              Légal
            </p>
            <ul className="footer-nav">
              <li>
                <a href="mailto:contact@deuxsaisonsdeplanche.fr">
                  contact@deuxsaisonsdeplanche.fr
                </a>
              </li>
              <li>
                <Link href="/mentions-legales">Mentions légales</Link>
              </li>
              <li>
                <Link href="/confidentialite">Confidentialité &amp; cookies</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__meta">
          <span>© {year} Deux saisons de planche</span>
          <span>Association loi 1901 · RNA W000000000</span>
        </div>
      </div>
    </footer>
  );
}
