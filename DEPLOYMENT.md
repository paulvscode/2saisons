# Déploiement — Vercel

Vercel est le meilleur choix pour ce projet (Next.js). Il faut 3 services :

| Besoin | Service recommandé | Alternatives |
| --- | --- | --- |
| Hébergement Next.js | **Vercel** | Netlify, Render, VPS + Node |
| PostgreSQL | **Neon** (ou Vercel Postgres, basé sur Neon) | Supabase, Railway, RDS |
| Stockage des justificatifs | **Vercel Blob** | S3, Supabase Storage, R2 |

> ⚠️ Le disque de Vercel est **éphémère** : `UPLOADS_DRIVER=local` ne fonctionne pas en production, d'où Vercel Blob.

---

## 1. Préparer le dépôt

```bash
# créer la première migration Prisma (obligatoire : le build prod fait `prisma migrate deploy`)
npx prisma migrate dev --name init      # génère prisma/migrations/**
npx tsc --noEmit                         # vérifier qu'il n'y a pas d'erreur de type
git add -A && git commit -m "Prépa déploiement"
git push          # sur GitHub / GitLab / Bitbucket
```

## 2. Base de données (Neon)

1. Créer un projet sur [neon.tech](https://neon.tech) → base `deux_saisons`.
2. Récupérer **deux** chaînes de connexion :
   - **Pooled** (`...-pooler...`, `?sslmode=require`) → `DATABASE_URL`
   - **Direct** (host sans `-pooler`, port 5432) → `DIRECT_URL`

## 3. Importer le projet dans Vercel

1. [vercel.com/new](https://vercel.com/new) → importer le repo. Framework détecté : **Next.js**. Ne rien changer aux commandes (le `build` du `package.json` fait `prisma generate && prisma migrate deploy && next build`).
2. **Storage → Create → Blob** : créer un store et le lier au projet. Vercel injecte automatiquement `BLOB_READ_WRITE_TOKEN`.
3. **Settings → Environment Variables** (Production + Preview) :

   | Variable | Valeur |
   | --- | --- |
   | `DATABASE_URL` | URL **poolée** Neon |
   | `DIRECT_URL` | URL **directe** Neon |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `APP_URL` | `https://votre-domaine.fr` (ou l'URL `*.vercel.app`) |
   | `UPLOADS_DRIVER` | `blob` |
   | `MEMBERSHIP_PRICE_CENTS` | `2000` |
   | `MEMBERSHIP_DURATION_MONTHS` | `12` |
   | `STRIPE_SECRET_KEY` | (optionnel — vide = mode démo) |
   | `STRIPE_WEBHOOK_SECRET` | (voir §5) |

4. **Deploy**. Le premier build applique la migration `init` sur la base Neon.

## 4. Créer le compte admin en production

Le seed complet n'est pas souhaitable en prod. Deux options :

```bash
# Option A — depuis ta machine, pointée sur la base de prod :
DATABASE_URL="<url directe Neon>" npx tsx prisma/seed.ts     # crée admin@ + member@ + données démo

# Option B — ne créer que l'admin (Prisma Studio) :
DATABASE_URL="<url directe Neon>" npx prisma studio
# → table users → New record : email, role=admin, passwordHash = hash bcrypt d'un mot de passe
```

Génération d'un hash bcrypt ponctuel :
`node -e "console.log(require('bcryptjs').hashSync('MON_MDP',10))"`

Pense à changer le mot de passe des comptes de démo si tu utilises l'option A.

## 5. Stripe (si paiement en ligne)

1. Dashboard Stripe → clés API → `STRIPE_SECRET_KEY` (live).
2. **Developers → Webhooks → Add endpoint** :
   - URL : `https://votre-domaine.fr/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Copier le **Signing secret** → `STRIPE_WEBHOOK_SECRET` dans Vercel.
3. Redéployer pour prendre en compte les variables.

## 6. Domaine

**Settings → Domains** → ajouter `deuxsaisonsdeplanche.fr`, suivre la config DNS. Mettre à jour `APP_URL` et l'URL du webhook Stripe en conséquence.

---

## Mises à jour ultérieures

- **Code** : `git push` → Vercel redéploie.
- **Schéma DB** : `npx prisma migrate dev --name xxx` en local → commit → push. Le build prod applique la migration via `prisma migrate deploy`.
- **Rollback** : onglet *Deployments* de Vercel → *Promote to Production* sur une version antérieure (attention aux migrations non réversibles).

## Tâche récurrente conseillée

Un cron (Vercel Cron ou GitHub Action) pour passer les adhésions échues en `expired` et envoyer les rappels de renouvellement. Non inclus — voir `getMembershipView` qui gère déjà l'affichage à la lecture.
