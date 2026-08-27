/**
 * URL publique du site. Ordre de priorité :
 *  1. APP_URL (si non vide)
 *  2. domaine de production Vercel (injecté automatiquement)
 *  3. localhost en dev
 */
export function siteUrl(path = ""): string {
  const fromEnv = process.env.APP_URL?.trim();
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  const base =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : fromVercel
        ? `https://${fromVercel}`
        : "http://localhost:3000";

  return `${base.replace(/\/+$/, "")}${path}`;
}
