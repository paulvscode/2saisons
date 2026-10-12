import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content";
import { Lines, SiteImage } from "@/components/site-image";

export const metadata: Metadata = {
  title: "USC — Ultra Skate Club",
  description:
    "L'Ultra Skate Club : un club de skate proposant des cours de skateboard pour tous les niveaux.",
};

export default async function UscPage() {
  const c = await getContent();

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">{c["usc.eyebrow"]}</p>
        <h1>{c["usc.title"]}</h1>
      </section>

      <section className="section section--tight wrap" aria-labelledby="usc-title">
        <h2 className="h-l" id="usc-title">
          {c["usc.intro.title"]}
        </h2>

        <div className="stack-l" style={{ marginTop: "1.5rem" }}>
          <p className="lead">
            <Lines text={c["usc.intro.lead"]} />
          </p>
          <p className="muted">
            <Lines text={c["usc.intro.text"]} />
          </p>
        </div>

        <div style={{ marginTop: "2.5rem" }}>
          <SiteImage
            src={c["usc.image"]}
            alt={c["usc.imageAlt"]}
            ratio="16x9"
            placeholder="Photo — cours USC"
          />
        </div>
      </section>

      <section className="section invert" aria-labelledby="usc-cta-title">
        <div className="wrap stack-l">
          <p className="eyebrow">{c["usc.cta.eyebrow"]}</p>
          <h2 className="h-l" id="usc-cta-title">
            <Lines text={c["usc.cta.title"]} />
          </h2>
          <p className="lead muted">
            <Lines text={c["usc.cta.text"]} />
          </p>
          <div>
            <a
              className="btn btn--block"
              href={c["usc.cta.url"]}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c["usc.cta.button"]}{" "}
              <span className="btn__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="section section--tight wrap">
        <p className="muted">
          {c["usc.contact"]}{" "}
          <Link href="/adhesion" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Contacte-nous
          </Link>
          .
        </p>
      </section>
    </>
  );
}
