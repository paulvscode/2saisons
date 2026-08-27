import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/stripe";
import { MembershipForm } from "@/components/membership-form";

export const metadata: Metadata = {
  title: "À propos & Adhésion",
  description:
    "L'équipe et les valeurs de l'association Deux saisons de planche, et le formulaire pour adhérer ou faire un don.",
};

const VALUES = [
  ["01", "Accessible", "Créneaux gratuits ou à petit prix, prêt de matériel, aucun niveau requis."],
  ["02", "Transmission", "Les plus expérimentés accompagnent les nouveaux, sans hiérarchie."],
  ["03", "Respect", "Des lieux, des riverains, des autres pratiques. On laisse les spots propres."],
  ["04", "Culture", "Le skate, c'est aussi la vidéo, la musique, le graphisme, le DIY."],
  ["05", "Autonomie", "Réparer, construire, s'organiser collectivement plutôt que consommer."],
  ["06", "Inclusif", "Toutes et tous bienvenus, quel que soit l'âge, le genre ou le parcours."],
];

export default async function AboutMembershipPage() {
  const user = await getCurrentUser();

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">Qui roule, pourquoi, comment nous rejoindre</p>
        <h1>À propos &amp; Adhésion</h1>
      </section>

      <section className="section section--tight wrap" aria-labelledby="about-title">
        <h2 className="h-l" id="about-title">
          L'association
        </h2>
        <div className="stack-l" style={{ marginTop: "1.5rem" }}>
          <p className="lead">
            Deux saisons de planche est née de l'envie de skater ensemble toute l'année, quel que
            soit le temps — une saison dehors, une saison à l'abri.
          </p>
          <p className="muted">
            Nous sommes un collectif de riders bénévoles. Nous ouvrons des créneaux encadrés,
            entretenons les spots, accompagnons les débutants et faisons circuler la culture skate.
            Pas de sélection : si tu poses un pied sur une planche, tu as ta place.
          </p>
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <div
            className="ph ph--16x9"
            role="img"
            aria-label="Portrait de groupe des membres de l'association"
            data-label="Photo — l'équipe"
          />
        </div>
      </section>

      <section className="section wrap" aria-labelledby="values-title">
        <h2 className="h-l" id="values-title">
          Nos valeurs
        </h2>
        <div className="values" style={{ marginTop: "2.5rem" }}>
          {VALUES.map(([n, t, d]) => (
            <div key={n}>
              <span className="value__n">{n}</span>
              <h3 className="value__t">{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="team-title">
        <h2 className="h-l" id="team-title">
          Le bureau
        </h2>
        <div className="team" style={{ marginTop: "2.5rem" }}>
          {["Présidence", "Trésorerie", "Secrétariat & événements"].map((role) => (
            <div key={role}>
              <div className="ph ph--1x1" role="img" aria-label="Portrait" data-label="Portrait" />
              <p className="member__name">Prénom Nom</p>
              <p className="member__role">{role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section invert" id="adherer" aria-labelledby="join-title">
        <div className="wrap">
          <p className="eyebrow">Une action, maintenant</p>
          <h2 className="h-xl" id="join-title" style={{ marginTop: ".5rem" }}>
            Adhérer ou faire un don
          </h2>
          <p className="muted" style={{ marginTop: "1rem", maxWidth: "42ch" }}>
            {user
              ? `Connecté·e en tant que ${user.firstname}. Ton adhésion sera rattachée à ton espace membre.`
              : "Quelques champs, deux minutes. Ton espace membre est créé automatiquement."}
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
