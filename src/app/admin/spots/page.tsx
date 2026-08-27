import type { Metadata } from "next";
import { getSpots, SPOT_TYPE_LABEL } from "@/lib/queries";
import { Disclosure } from "@/components/disclosure";
import { ActionButton } from "@/components/action-button";
import { deleteSpot } from "../actions";
import { SpotForm } from "./spot-form";

export const metadata: Metadata = { title: "Spots — Admin" };

export default async function AdminSpotsPage() {
  const spots = await getSpots();

  return (
    <>
      <div className="app-header">
        <h1>Spots</h1>
      </div>

      <section className="card">
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Nouveau spot
        </h2>
        <Disclosure label="+ Ajouter un spot" openLabel="Annuler" className="btn btn--sm">
          <SpotForm />
        </Disclosure>
      </section>

      <div className="table-scroll" style={{ marginTop: "var(--space-l)" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {spots.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <br />
                  <span className="field__hint">{s.description}</span>
                </td>
                <td>{SPOT_TYPE_LABEL[s.type]}</td>
                <td>{s.address}</td>
                <td>
                  <div className="inline-actions" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <Disclosure label="Modifier">
                      <SpotForm spot={s} />
                    </Disclosure>
                    <ActionButton
                      action={deleteSpot}
                      id={s.id}
                      className="link-btn link-btn--danger"
                      confirm={`Supprimer le spot « ${s.name} » ?`}
                    >
                      Supprimer
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {spots.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Aucun spot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
