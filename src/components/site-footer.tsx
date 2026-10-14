import Link from "next/link";
import { getContent } from "@/lib/content";
import { Lines } from "@/components/site-image";

export async function SiteFooter() {
  const c = await getContent();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap wrap--wide">
        <div className="site-footer__grid">
          <div>
            <h2>
              <Lines text={c["footer.title"]} />
            </h2>
            <p className="muted" style={{ marginTop: "1.5rem", maxWidth: "28ch" }}>
              <Lines text={c["footer.text"]} />
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
                <Link href="/mission">Mission</Link>
              </li>
              <li>
                <Link href="/evenements">Événements</Link>
              </li>
              <li>
                <Link href="/liens">Liens</Link>
              </li>
              <li>
                <Link href="/quiz">Quiz</Link>
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
                <a href={`mailto:${c["site.email"]}`}>{c["site.email"]}</a>
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
          <span>Association loi 1901 · RNA {c["site.rna"]}</span>
        </div>
      </div>
    </footer>
  );
}
