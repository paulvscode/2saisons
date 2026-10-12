import Image from "next/image";
import { Fragment } from "react";

type Ratio = "1x1" | "16x9" | "hero";

/**
 * Image éditable depuis l'admin. Sans image choisie, affiche le placeholder hachuré.
 * Le cadre fixe le ratio ; la photo est recadrée (object-fit: cover).
 */
export function SiteImage({
  src,
  alt,
  ratio,
  placeholder,
  sizes = "(min-width: 46rem) 46rem, 100vw",
  priority,
}: {
  src: string;
  alt: string;
  ratio: Ratio;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return <div className={`ph ph--${ratio}`} role="img" aria-label={alt} data-label={placeholder ?? alt} />;
  }
  return (
    <div className={`media ph--${ratio}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}

/** Rend les retours à la ligne d'un texte éditable. */
export function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}
