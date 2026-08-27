import Link from "next/link";
import Image from "next/image";
import { getUpcomingEvents } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export default async function HomePage() {
  const events = await getUpcomingEvents(3);

  return (
    <>
      <section className="hero wrap wrap--wide" aria-labelledby="hero-title">
        <div className="hero__media">
          {/* Remplacer par la vraie photo : public/images/hero.jpg (paysage, ~1600×1000). */}
          <Image
            className="hero__img"
            src="/images/hero.jpg"
            alt="Skateur en plein grind sur un curb"
            width={1600}
            height={1000}
            priority
            sizes="(min-width: 74rem) 74rem, 100vw"
          />
        </div>
        <div className="wrap" style={{ paddingInline: 0 }}>
          <p className="eyebrow">Association loi 1901</p>
          <h1 className="hero__title" id="hero-title">
            Deux saisons de planche
          </h1>
          <p className="lead hero__mission">
            Promouvoir la pratique du skateboard et la culture associée.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--block" href="/adhesion#adherer">
              Rejoindre l'association <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="next-title">
        <div className="wrap">
          <p className="eyebrow">Prochainement</p>
          <h2 className="h-xl" id="next-title" style={{ marginTop: ".5rem" }}>
            {events.length > 0 ? "Les prochains rendez-vous" : "Agenda en préparation"}
          </h2>

          {events.length > 0 ? (
            <ol className="events" style={{ marginTop: "2.5rem" }}>
              {events.map((event) => (
                <li key={event.id} className="event">
                  <p className="event__date">{formatDate(event.date)}</p>
                  <div className="event__body stack">
                    <h3 className="event__title">
                      <Link href={`/evenements#${event.slug}`}>{event.title}</Link>
                    </h3>
                    <p className="event__meta">
                      {formatTime(event.date)} · {event.location}
                    </p>
                    <p>{event.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted" style={{ marginTop: "1.5rem" }}>
              Les prochaines sessions sont en cours de calage. Reviens vite ou adhère pour être prévenu·e.
            </p>
          )}

          <div style={{ marginTop: "3rem" }}>
            <Link className="btn btn--ghost btn--block" href="/evenements">
              Voir tous les événements &amp; spots{" "}
              <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section invert" aria-labelledby="mani-title">
        <div className="wrap stack-l">
          <p className="eyebrow">Notre raison d'être</p>
          <Reveal>
            <h2 className="h-l">
              Deux saisons, une planche, une communauté qui roule toute l'année.
            </h2>
          </Reveal>
          <p className="lead muted">
            Nous ouvrons des créneaux, entretenons les spots, formons les nouveaux et faisons vivre
            la culture skate localement.
          </p>
          <div>
            <Link className="btn" href="/adhesion">
              Découvrir l'association <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
