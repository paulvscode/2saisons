"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Carte Google Maps chargée au clic : l'iframe Google dépose des cookies tiers,
 * qui nécessitent le consentement du visiteur (voir /confidentialite).
 */
export function MapEmbed({ query }: { query: string }) {
  const [loaded, setLoaded] = useState(false);
  const q = encodeURIComponent(query);

  if (loaded) {
    return (
      <div className="map-embed">
        <iframe
          title={`Carte — ${query}`}
          // URL d'intégration finale (l'ancienne forme ?output=embed redirige, avec X-Frame-Options).
          src={`https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${q.replace(/!/g, "%21")}!6i13`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="map-embed map-embed--consent ph">
      <div className="map-embed__consent stack">
        <p>
          La carte est fournie par Google Maps, qui dépose des cookies.{" "}
          <Link href="/confidentialite#cookies">En savoir plus</Link>
        </p>
        <div>
          <button type="button" className="btn btn--sm" onClick={() => setLoaded(true)}>
            Afficher la carte
          </button>
        </div>
        <a
          className="field__hint"
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir dans Google Maps ↗
        </a>
      </div>
    </div>
  );
}
