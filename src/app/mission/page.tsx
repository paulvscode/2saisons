import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { MISSION_COUNT } from "@/lib/content-schema";
import { Lines } from "@/components/site-image";

export const metadata: Metadata = {
  title: "Mission",
  description:
    "Les objectifs de l'association Deux saisons de planche : cohabitation, projets urbains et participation aux projets skate de la ville.",
};

export default async function MissionPage() {
  const c = await getContent();
  const axes = Array.from({ length: MISSION_COUNT }, (_, i) => i + 1).filter(
    (n) => c[`mission.${n}.title`],
  );

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">{c["mission.eyebrow"]}</p>
        <h1>{c["mission.title"]}</h1>
        {c["mission.intro"] && (
          <p className="lead" style={{ marginTop: "var(--space-m)" }}>
            <Lines text={c["mission.intro"]} />
          </p>
        )}
      </section>

      <section className="section section--tight wrap">
        {axes.map((n, i) => {
          const points = c[`mission.${n}.points`]
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean);
          return (
            <div key={n} className="mission-axis">
              <span className="value__n">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="h-l">{c[`mission.${n}.title`]}</h2>
              {c[`mission.${n}.intro`] && (
                <p className="lead" style={{ marginTop: "var(--space-s)" }}>
                  <Lines text={c[`mission.${n}.intro`]} />
                </p>
              )}
              {points.length > 0 && (
                <ul className="mission-points">
                  {points.map((point, j) => {
                    // « Libellé : texte » -> libellé en gras.
                    const [label, ...text] = point.split(" : ");
                    return (
                      <li key={j}>
                        {text.length > 0 ? (
                          <>
                            <strong>{label}</strong> : {text.join(" : ")}
                          </>
                        ) : (
                          point
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
