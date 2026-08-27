import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe est optionnel : sans clé, l'app bascule en "mode démo" (adhésion validée sans paiement).
 * `apiVersion` non spécifiée -> on suit la version épinglée par le SDK installé.
 */
export const stripe = key ? new Stripe(key) : null;

export const stripeEnabled = Boolean(stripe);

export function appUrl(path = "") {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}
