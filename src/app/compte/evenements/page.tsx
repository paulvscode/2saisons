import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { registerToEvent, unregisterFromEvent } from "../actions";

export const metadata: Metadata = { title: "Mes événements" };

export default async function MemberEventsPage() {
  const user = await requireUser();

  const [upcoming, history] = await Promise.all([
    prisma.event.findMany({
      where: { published: true, date: { gte: startOfToday() } },
      orderBy: { date: "asc" },
      include: {
        _count: { select: { registrations: true } },
        registrations: { where: { userId: user.id } },
      },
    }),
    prisma.eventRegistration.findMany({
      where: { userId: user.id, event: { date: { lt: startOfToday() } } },
      include: { event: true },
      orderBy: { event: { date: "desc" } },
    }),
  ]);

  return (
    <>
      <div className="app-header">
        <h1>Mes événements</h1>
      </div>

      <section>
        <h2 className="h-m">À venir</h2>
        <ol className="events" style={{ marginTop: "1.5rem" }}>
          {upcoming.map((event) => {
            const reg = event.registrations[0];
            const registered = reg?.status === "registered";
            const full = Boolean(event.capacity && event._count.registrations >= event.capacity);
            return (
              <li key={event.id} className="event event--action">
                <p className="event__date">{formatDate(event.date)}</p>
                <div className="event__body stack">
                  <h3 className="event__title">{event.title}</h3>
                  <p className="event__meta">
                    {formatTime(event.date)} · {event.location}
                  </p>
                  <p>{event.description}</p>
                </div>
                {registered ? (
                  <ActionButton
                    action={unregisterFromEvent}
                    id={event.id}
                    className="btn btn--sm btn--ghost"
                    confirm="Annuler ton inscription ?"
                  >
                    Se désinscrire
                  </ActionButton>
                ) : full ? (
                  <span className="badge badge--muted">Complet</span>
                ) : (
                  <ActionButton action={registerToEvent} id={event.id}>
                    S'inscrire
                  </ActionButton>
                )}
              </li>
            );
          })}
          {upcoming.length === 0 && <li className="muted">Aucun événement programmé.</li>}
        </ol>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Historique</h2>
        <div className="table-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Événement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {history.map(({ id, event, status }) => (
                <tr key={id}>
                  <td>{formatDate(event.date)}</td>
                  <td>{event.title}</td>
                  <td>
                    {status === "attended"
                      ? "Présent·e"
                      : status === "cancelled"
                        ? "Annulée"
                        : "Inscrit·e"}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    Pas encore d'événement passé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
