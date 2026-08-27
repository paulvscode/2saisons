import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidentialité & cookies",
  description:
    "Politique de protection des données personnelles (RGPD) et usage des cookies du site Deux saisons de planche.",
};

export default function PrivacyPage() {
  return (
    <section className="section wrap">
      <p className="eyebrow">RGPD</p>
      <h1 className="h-xl" style={{ marginTop: ".5rem" }}>
        Confidentialité &amp; cookies
      </h1>

      <div className="prose" style={{ marginTop: "var(--space-l)" }}>
        <h2>Responsable du traitement</h2>
        <p>
          Association Deux saisons de planche, siège social 00 rue de l'Exemple, 00000 Ville —
          contact@deuxsaisonsdeplanche.fr.
        </p>

        <h2>Données collectées et finalités</h2>
        <ul>
          <li>
            <strong>Compte &amp; adhésion</strong> : nom, prénom, e-mail, téléphone, historique de
            cotisation — gestion des membres et de la vie associative.
          </li>
          <li>
            <strong>Justificatifs</strong> : certificat médical, attestation d'assurance — vérification
            des conditions de pratique. Documents à accès restreint (membre concerné + bureau).
          </li>
          <li>
            <strong>Inscriptions aux événements</strong> : participation aux sessions et contests.
          </li>
          <li>
            <strong>Paiements</strong> : gérés par notre prestataire ; nous ne conservons qu'une
            référence de transaction et le montant.
          </li>
        </ul>

        <h2>Base légale</h2>
        <p>
          Exécution du contrat d'adhésion, respect d'obligations légales (comptabilité, assurance),
          et intérêt légitime de l'association pour la gestion de ses activités.
        </p>

        <h2>Durées de conservation</h2>
        <ul>
          <li>Données de membre : durée de l'adhésion + 3 ans.</li>
          <li>Pièces comptables : 10 ans (obligation légale).</li>
          <li>Justificatifs médicaux : supprimés à la fin de la saison concernée.</li>
        </ul>

        <h2>Destinataires</h2>
        <p>
          Les membres du bureau habilités et nos sous-traitants techniques (hébergeur, prestataire de
          paiement). Aucune donnée n'est vendue ni transmise à des fins publicitaires.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition
          et de portabilité. Exercice à{" "}
          <a href="mailto:contact@deuxsaisonsdeplanche.fr">contact@deuxsaisonsdeplanche.fr</a>. Vous
          pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site n'utilise <strong>aucun cookie de traçage, de publicité ou de mesure d'audience
          tierce</strong>. Seul un cookie strictement nécessaire est déposé :
        </p>
        <ul>
          <li>
            <code>2sdp_session</code> — maintien de la connexion à l'espace membre. Durée : 30 jours.
            Exempté de consentement (article 82 loi Informatique et Libertés).
          </li>
        </ul>
        <p>
          Un choix technique local (<code>2sdp_cookie_choice</code>) est stocké dans votre navigateur
          pour ne plus afficher le bandeau d'information — il ne quitte jamais votre appareil.
        </p>
      </div>
    </section>
  );
}
