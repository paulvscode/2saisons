import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "USC — Ultra Skate Club",
  description:
    "L'Ultra Skate Club : un club de skate proposant des cours de skateboard pour tous les niveaux.",
};

const USC_URL = "https://www.ultraskateclub.com/";

export default function UscPage() {
  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">Ultra Skate Club</p>
        <h1>USC</h1>
      </section>

      <section className="section section--tight wrap" aria-labelledby="usc-title">
        <h2 className="h-l" id="usc-title">
          Un club, des cours, une progression
        </h2>

        <div className="stack-l" style={{ marginTop: "1.5rem" }}>
          <p className="lead">
            L'Ultra Skate Club (USC) est un club de skate qui propose des cours de skateboard
            encadrés, du premier push aux premiers tricks.
          </p>
          <p className="muted">
            Séances collectives ou individuelles, tous âges et tous niveaux : l'USC accompagne
            celles et ceux qui veulent apprendre, se remettre en selle ou passer un cap, dans le
            même esprit que « Deux saisons de planche » — accessible, sans pression, orienté plaisir.
          </p>
        </div>

        <div style={{ marginTop: "2.5rem" }}>
          <div
            className="ph ph--16x9"
            role="img"
            aria-label="Cours de skateboard de l'Ultra Skate Club"
            data-label="Photo — cours USC"
          />
        </div>
      </section>

      <section className="section invert" aria-labelledby="usc-cta-title">
        <div className="wrap stack-l">
          <p className="eyebrow">S'inscrire aux cours</p>
          <h2 className="h-l" id="usc-cta-title">
            Toutes les infos et les inscriptions sur le site de l'USC
          </h2>
          <p className="lead muted">
            Planning des cours, tarifs et formulaire d'inscription sont gérés directement par
            l'Ultra Skate Club.
          </p>
          <div>
            <a
              className="btn btn--block"
              href={USC_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Aller sur ultraskateclub.com{" "}
              <span className="btn__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="section section--tight wrap">
        <p className="muted">
          Une question sur le lien entre l'USC et l'association ?{" "}
          <Link href="/adhesion" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Contacte-nous
          </Link>
          .
        </p>
      </section>
    </>
  );
}
