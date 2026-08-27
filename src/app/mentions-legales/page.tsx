import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Informations légales de l'association Deux saisons de planche.",
};

export default function LegalPage() {
  return (
    <section className="section wrap">
      <p className="eyebrow">Informations légales</p>
      <h1 className="h-xl" style={{ marginTop: ".5rem" }}>
        Mentions légales
      </h1>

      <div className="prose" style={{ marginTop: "var(--space-l)" }}>
        <h2>Éditeur du site</h2>
        <p>
          <strong>Deux saisons de planche</strong> — association régie par la loi du 1<sup>er</sup>{" "}
          juillet 1901.
          <br />
          Siège social : 00 rue de l'Exemple, 00000 Ville.
          <br />
          RNA : W000000000 · SIREN : 000 000 000 · SIRET : 000 000 000 00000.
          <br />
          Adresse e-mail : contact@deuxsaisonsdeplanche.fr
        </p>

        <h3>Directeur de la publication</h3>
        <p>Le·la président·e de l'association, représentant·e légal·e.</p>

        <h2>Hébergement</h2>
        <p>
          Site hébergé par <strong>[Nom de l'hébergeur]</strong>, [adresse de l'hébergeur],
          [téléphone].
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus (textes, photographies, identité visuelle) est la propriété de
          l'association ou de ses partenaires, sauf mention contraire. Toute reproduction sans
          autorisation est interdite.
        </p>

        <h2>Paiements</h2>
        <p>
          Les adhésions et dons en ligne sont traités par un prestataire de paiement sécurisé
          (Stripe Payments Europe, Ltd. ou HelloAsso selon la configuration). Aucune donnée bancaire
          n'est stockée sur nos serveurs.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question relative au site ou à l'association :{" "}
          <a href="mailto:contact@deuxsaisonsdeplanche.fr">contact@deuxsaisonsdeplanche.fr</a>.
        </p>
      </div>
    </section>
  );
}
