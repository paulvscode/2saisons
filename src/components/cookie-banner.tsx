"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "2sdp_cookie_choice";

/**
 * Bandeau de consentement simplifié — RGPD.
 * Le site n'utilise AUCUN traceur tiers ni cookie publicitaire :
 * seul un cookie de session strictement nécessaire est déposé (espace membre).
 * Ce bandeau se contente d'informer et de mémoriser l'accusé de lecture.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* stockage indisponible : on n'affiche rien */
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Information cookies">
      <p>
        Ce site ne dépose qu'un cookie de session nécessaire à votre connexion. Aucun traceur
        publicitaire, aucune mesure d'audience tierce.{" "}
        <Link href="/confidentialite">En savoir plus</Link>.
      </p>
      <div className="cookie-banner__row">
        <button className="btn btn--sm btn--block" type="button" onClick={acknowledge}>
          J'ai compris
        </button>
      </div>
    </div>
  );
}
