import type { Metadata } from "next";
import Link from "next/link";
import { getSpots, getUpcomingEvents, SPOT_TYPE_LABEL } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Événements & Spots",
  description:
    "Le calendrier des sessions, contests et jams de l'association et la liste des skateparks et spots locaux.",
};

export default async function EventsPage() {
  const [events, spots] = await Promise.all([getUpcomingEvents(), getSpots()]);

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">Calendrier</p>
        <h1>Événements &amp; Spots</h1>
      </section>

      <section className="section section--tight wrap" aria-labelledby="events-title">
        <h2 className="h-l" id="events-title">
          Événements
        </h2>
        <p className="muted" style={{ marginTop: ".75rem", maxWidth: "44ch" }}>
          Sessions, contests et jams, dans l'ordre chronologique. Connecte-toi à ton espace membre
          pour t'inscrire en un clic.
        </p>

        {events.length > 0 ? (
          <ol className="events" style={{ marginTop: "2.5rem" }}>
            {events.map((event) => (
              <li key={event.id} id={event.slug} className="event">
                <p className="event__date">{formatDate(event.date)}</p>
                <div className="event__body stack">
                  <h3 className="event__title">{event.title}</h3>
                  <p className="event__meta">
                    {formatTime(event.date)} · {event.location}
                    {event.capacity ? ` · ${event._count.registrations}/${event.capacity} inscrits` : ""}
                  </p>
                  <p>{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted" style={{ marginTop: "1.5rem" }}>
            Aucun événement programmé pour le moment.
          </p>
        )}

        <div style={{ marginTop: "3rem" }}>
          <Link className="btn btn--block" href="/adhesion#adherer">
            Adhérer pour s'inscrire aux sessions{" "}
            <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="section invert" aria-labelledby="spots-title">
        <div className="wrap">
          <h2 className="h-l" id="spots-title">
            Spots
          </h2>
          <p className="muted" style={{ marginTop: ".75rem", maxWidth: "44ch" }}>
            Les skateparks et spots street que nous pratiquons et entretenons. Respecte les lieux,
            les riverains et les autres riders.
          </p>

          <div style={{ marginTop: "2.5rem" }}>
            <div
              className="ph ph--16x9"
              role="img"
              aria-label="Carte simplifiée des spots de skate de la ville"
              data-label="Carte — spots (placeholder)"
            />
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            {spots.length > 0 ? (
              spots.map((spot) => (
                <div key={spot.id} className="spot">
                  <p className="spot__type">{SPOT_TYPE_LABEL[spot.type] ?? spot.type}</p>
                  <p className="spot__name">{spot.name}</p>
                  <p className="muted">{spot.address}</p>
                  <p>{spot.description}</p>
                </div>
              ))
            ) : (
              <p className="muted">La liste des spots arrive bientôt.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
