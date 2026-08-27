import type { Metadata } from "next";
import { getAllEventsForAdmin } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { Disclosure } from "@/components/disclosure";
import { ActionButton } from "@/components/action-button";
import { deleteEvent } from "../actions";
import { EventForm } from "./event-form";

export const metadata: Metadata = { title: "Événements — Admin" };

export default async function AdminEventsPage() {
  const events = await getAllEventsForAdmin();

  return (
    <>
      <div className="app-header">
        <h1>Événements</h1>
      </div>

      <section className="card">
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Nouvel événement
        </h2>
        <Disclosure label="+ Ajouter un événement" openLabel="Annuler" className="btn btn--sm">
          <EventForm />
        </Disclosure>
      </section>

      <div className="table-scroll" style={{ marginTop: "var(--space-l)" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Événement</th>
              <th>Inscrits</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  {formatDate(e.date)}
                  <br />
                  <span className="field__hint">{formatTime(e.date)}</span>
                </td>
                <td>
                  <strong>{e.title}</strong>
                  <br />
                  <span className="field__hint">
                    {e.location} · /evenements#{e.slug}
                  </span>
                </td>
                <td>
                  {e._count.registrations}
                  {e.capacity ? ` / ${e.capacity}` : ""}
                </td>
                <td>
                  {e.published ? (
                    <span className="badge badge--ok">Publié</span>
                  ) : (
                    <span className="badge badge--muted">Brouillon</span>
                  )}
                </td>
                <td>
                  <div className="inline-actions" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <Disclosure label="Modifier">
                      <EventForm event={e} />
                    </Disclosure>
                    <ActionButton
                      action={deleteEvent}
                      id={e.id}
                      className="link-btn link-btn--danger"
                      confirm={`Supprimer « ${e.title} » ? Les inscriptions seront perdues.`}
                    >
                      Supprimer
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Aucun événement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
