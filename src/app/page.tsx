import Link from "next/link";
import { getUpcomingEvents } from "@/lib/queries";
import { getContent } from "@/lib/content";
import { formatDate, formatTime } from "@/lib/format";
import { Lines, SiteImage } from "@/components/site-image";

export default async function HomePage() {
  const [events, c] = await Promise.all([getUpcomingEvents(3), getContent()]);

  return (
    <>
      <section className="hero wrap wrap--wide" aria-labelledby="hero-title">
        <div className="hero__media">
          <SiteImage
            src={c["home.hero.image"]}
            alt={c["home.hero.imageAlt"]}
            ratio="hero"
            priority
            sizes="(min-width: 74rem) 74rem, 100vw"
          />
        </div>
        <div className="wrap" style={{ paddingInline: 0 }}>
          <p className="eyebrow">{c["home.hero.eyebrow"]}</p>
          <h1 className="hero__title" id="hero-title">
            {c["home.hero.title"]}
          </h1>
          <p className="lead hero__mission">
            <Lines text={c["home.hero.mission"]} />
          </p>
          <div className="hero__cta">
            <Link className="btn btn--block" href="/adhesion#adherer">
              {c["home.hero.cta"]} <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="next-title">
        <div className="wrap">
          <p className="eyebrow">{c["home.events.eyebrow"]}</p>
          <h2 className="h-xl" id="next-title" style={{ marginTop: ".5rem" }}>
            {events.length > 0 ? c["home.events.title"] : c["home.events.emptyTitle"]}
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
              <Lines text={c["home.events.empty"]} />
            </p>
          )}

          <div style={{ marginTop: "3rem" }}>
            <Link className="btn btn--ghost btn--block" href="/evenements">
              {c["home.events.cta"]}{" "}
              <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
