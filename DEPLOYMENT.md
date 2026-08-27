# Déploiement — Vercel + Neon + Vercel Blob

| Besoin | Service |
| --- | --- |
| Hébergement Next.js | **Vercel** |
| PostgreSQL | **Neon** (via l'intégration Vercel → Storage) |
| Stockage des justificatifs | **Vercel Blob** |

> ⚠️ Le disque de Vercel est **éphémère** : `UPLOADS_DRIVER=local` ne fonctionne pas en prod, d'où Vercel Blob.
> Le build Vercel ne touche pas à la base (`build = prisma generate && next build`). Les migrations
> se lancent à la main depuis ta machine (étape 4).

---

## 1. Pousser le code

```bash
cd /Users/paul/Desktop/dev/2saisons
npm run build            # reproduit le build Vercel en local — doit passer
git add .
git commit -m "Déploiement"
git push
```

Sur [vercel.com/new](https://vercel.com/new), importer le repo `paulvscode/2saisons` (framework détecté : Next.js). Le premier déploiement va **échouer** faute de base de données — c'est normal, on corrige aux étapes suivantes.

## 2. Créer la base — Vercel → Storage

1. Projet Vercel → onglet **Storage** → **Create Database** → **Neon** (Serverless Postgres).
2. Région : **Europe (Frankfurt)** de préférence. Valider.
3. Vercel connecte la base au projet et ajoute automatiquement les variables d'environnement, dont :
   - `DATABASE_URL` → chaîne **poolée** (`...-pooler...`) — c'est celle que l'app utilise.
   - `DATABASE_URL_UNPOOLED` (ou `POSTGRES_URL_NON_POOLING`) → chaîne **directe** — utile pour les migrations.

Rien d'autre à faire côté `DATABASE_URL` : elle est déjà là.

## 3. Créer le store de fichiers — Vercel → Storage

**Storage → Create Database → Blob** → créer le store, le lier au projet.
Vercel injecte automatiquement `BLOB_READ_WRITE_TOKEN`.

## 4. Appliquer le schéma sur Neon (depuis ta machine)

Récupère la chaîne **directe** (`DATABASE_URL_UNPOOLED`) dans Vercel → Settings → Environment Variables (bouton "reveal"). Puis :

```bash
# créer le schéma + les tables
DATABASE_URL="<chaîne DIRECTE Neon>" npx prisma migrate deploy

# créer le compte admin (+ données de démo)
DATABASE_URL="<chaîne DIRECTE Neon>" npx tsx prisma/seed.ts
```

> Utilise bien la chaîne **directe** ici : le pooler ne gère pas les migrations.
> `seed.ts` crée `admin@deuxsaisonsdeplanche.fr` / `password123` — **change ce mot de passe** ensuite
> (via `/compte/parametres` une fois connecté, ou Prisma Studio).

## 5. Variables d'environnement Vercel

Settings → Environment Variables → ajouter (cocher **Production**, **Preview**, **Development**) :

| Variable | Valeur |
| --- | --- |
| `AUTH_SECRET` | sortie de `openssl rand -base64 32` |
| `APP_URL` | l'URL du site (`https://2saisons-xxx.vercel.app` puis ton domaine) |
| `UPLOADS_DRIVER` | `blob` |
| `MEMBERSHIP_PRICE_CENTS` | `2000` |
| `MEMBERSHIP_DURATION_MONTHS` | `12` |
| `STRIPE_SECRET_KEY` | *(optionnel — vide = adhésion validée sans paiement)* |
| `STRIPE_WEBHOOK_SECRET` | *(voir §7)* |

`DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` sont déjà présents (étapes 2 et 3).

## 6. Redéployer

Deployments → dernier déploiement → **⋯ → Redeploy**. Cette fois il doit passer.
Teste : page d'accueil, `/adhesion`, connexion admin, `/admin`.

## 7. Stripe (si paiement en ligne)

1. Dashboard Stripe → clés API → `STRIPE_SECRET_KEY` (live) dans Vercel.
2. **Developers → Webhooks → Add endpoint** :
   - URL : `https://<ton-domaine>/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Copier le *Signing secret* → `STRIPE_WEBHOOK_SECRET` dans Vercel.
3. Redéployer.

## 8. Domaine

Settings → Domains → ajouter `deuxsaisonsdeplanche.fr`, suivre la config DNS.
Mettre à jour `APP_URL` et l'URL du webhook Stripe.

---

## Mises à jour ultérieures

- **Code** : `git push` → Vercel redéploie tout seul.
- **Schéma DB** : `npx prisma migrate dev --name xxx` en local → commit → push →
  `DATABASE_URL="<directe Neon>" npx prisma migrate deploy` pour appliquer en prod.
- **Rollback** : Deployments → *Promote to Production* sur une version antérieure.

## Tâche récurrente conseillée

Un cron (Vercel Cron) pour passer les adhésions échues en `expired` et envoyer les rappels de
renouvellement. Non inclus — `getMembershipView` gère déjà l'affichage à la lecture.
