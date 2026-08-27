import type { Metadata } from "next";
import { requireUser, getMembershipView } from "@/lib/auth";
import { formatDateLong } from "@/lib/format";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon compte" };

export default async function SettingsPage() {
  const user = await requireUser();
  const view = await getMembershipView(user.id);

  return (
    <>
      <div className="app-header">
        <h1>Mon compte</h1>
      </div>

      <section>
        <h2 className="h-m">Informations personnelles</h2>
        <p className="muted" style={{ margin: ".5rem 0 1.5rem" }}>
          E-mail de connexion : <strong>{user.email}</strong>
        </p>
        <ProfileForm firstname={user.firstname} lastname={user.lastname} phone={user.phone} />
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Documents</h2>
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <p className="card__label">Reçu d'adhésion</p>
          {view.current && (view.status === "active" || view.status === "expiring") ? (
            <p style={{ marginTop: ".5rem" }}>
              Adhésion {formatDateLong(view.current.startDate)} —{" "}
              {formatDateLong(view.current.endDate)}.{" "}
              <a
                className="link-btn"
                href={`/api/receipt/${view.current.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Télécharger le reçu
              </a>
            </p>
          ) : (
            <p className="muted" style={{ marginTop: ".5rem" }}>
              Le reçu sera disponible une fois l'adhésion active.
            </p>
          )}
        </div>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Données personnelles (RGPD)</h2>
        <p className="muted" style={{ marginTop: ".5rem", maxWidth: "52ch" }}>
          Pour exercer tes droits d'accès, de rectification, de portabilité ou de suppression,
          écris à{" "}
          <a href="mailto:contact@deuxsaisonsdeplanche.fr">contact@deuxsaisonsdeplanche.fr</a>. La
          suppression du compte entraîne l'effacement de tes données sous 30 jours, hors obligations
          comptables légales.
        </p>
      </section>
    </>
  );
}
