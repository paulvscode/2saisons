import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe";
import { MembershipForm } from "@/components/membership-form";
import { getContent } from "@/lib/content";
import { BOARD_COUNT } from "@/lib/content-schema";
import { SiteImage } from "@/components/site-image";

export const metadata: Metadata = {
  title: "À propos & Adhésion",
  description:
    "L'équipe et les valeurs de l'association Deux saisons de planche, et le formulaire pour adhérer ou faire un don.",
};

export default async function AboutMembershipPage() {
  const [user, c] = await Promise.all([getCurrentUser(), getContent()]);
  const board = Array.from({ length: BOARD_COUNT }, (_, i) => i + 1).filter(
    (n) => c[`about.board.${n}.name`],
  );

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">{c["about.eyebrow"]}</p>
        <h1>{c["about.title"]}</h1>
      </section>

      <section className="section section--tight wrap" aria-labelledby="about-title">
        <h2 className="h-l" id="about-title">
          {c["about.intro.title"]}
        </h2>
        <div style={{ marginTop: "1.5rem" }}>
          <SiteImage
            src={c["about.image"]}
            alt={c["about.imageAlt"]}
            ratio="16x9"
            placeholder="Photo — l'équipe"
          />
        </div>
      </section>

      <section className="section wrap" aria-labelledby="team-title">
        <h2 className="h-l" id="team-title">
          {c["about.board.title"]}
        </h2>
        <div className="team" style={{ marginTop: "2.5rem" }}>
          {board.map((n) => (
            <div key={n}>
              <SiteImage
                src={c[`about.board.${n}.photo`]}
                alt={`Portrait — ${c[`about.board.${n}.name`]}`}
                ratio="1x1"
                placeholder="Portrait"
                sizes="(min-width: 46rem) 15rem, 50vw"
              />
              <p className="member__name">{c[`about.board.${n}.name`]}</p>
              <p className="member__role">{c[`about.board.${n}.role`]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section invert" id="adherer" aria-labelledby="join-title">
        <div className="wrap">
          <p className="eyebrow">{c["about.join.eyebrow"]}</p>
          <h2 className="h-xl" id="join-title" style={{ marginTop: ".5rem" }}>
            {c["about.join.title"]}
          </h2>
          <p className="muted" style={{ marginTop: "1rem", maxWidth: "42ch" }}>
            {user
              ? `Connecté·e en tant que ${user.firstname}. Ton adhésion sera rattachée à ton espace membre.`
              : c["about.join.text"]}
          </p>

          <MembershipForm
            authenticated={Boolean(user)}
            stripeEnabled={stripeEnabled}
            defaultEmail={user?.email}
            defaultFirstname={user?.firstname}
            defaultLastname={user?.lastname}
          />
        </div>
      </section>
    </>
  );
}
