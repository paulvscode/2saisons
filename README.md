# Deux saisons de planche

Site de l'association **Deux saisons de planche** — promotion de la pratique du skateboard et de sa culture.

Application **Next.js 15** (App Router, TypeScript, React 19) · **PostgreSQL** via **Prisma** · authentification maison (cookie httpOnly + JWT) · paiement **Stripe** (optionnel) · style _minimalist streetwear_ en CSS moderne, sans framework UI.

---

## Démarrage rapide

```bash
# 1. Dépendances (Node >= 18.18 — nvm use 20)
npm install

# 2. Configuration
cp .env.example .env        # AUTH_SECRET (openssl rand -base64 32) ; DATABASE_URL déjà OK pour Docker

# 3. Base de données PostgreSQL (via Docker)
docker compose up -d        # démarre Postgres 16 sur localhost:5432
npm run db:push             # applique le schéma Prisma
npm run db:seed             # jeux de données de démo + comptes de test

# 4. Lancer
npm run dev                 # http://localhost:3000
```

> Pas de Docker ? Installe PostgreSQL localement (`brew install postgresql@16 && brew services start postgresql@16`),
> crée la base (`createdb deux_saisons`) et adapte `DATABASE_URL` dans `.env`.
>
> Arrêter / réinitialiser la base : `docker compose down` (garde les données) · `docker compose down -v` (efface tout).

### Comptes de démonstration (après `db:seed`)

| Rôle   | E-mail                                | Mot de passe  |
| ------ | ------------------------------------- | ------------- |
| Admin  | `admin@deuxsaisonsdeplanche.fr`       | `password123` |
| Membre | `member@deuxsaisonsdeplanche.fr`      | `password123` |

### Paiement

Sans `STRIPE_SECRET_KEY`, l'app tourne en **mode démo** : l'adhésion est activée immédiatement, sans paiement réel. Avec les clés Stripe :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # -> STRIPE_WEBHOOK_SECRET
```

---

## Structure

```
src/
├── middleware.ts                 Protection /compte/* et /admin/*
├── app/
│   ├── layout.tsx  globals.css   Design system + header/footer/cookies
│   ├── page.tsx                  Accueil (hero, mission, 3 prochains événements)
│   ├── evenements/               Agenda + spots (public)
│   ├── adhesion/                 À propos, valeurs, équipe + formulaire d'adhésion
│   │   └── actions.ts            submitMembership → Stripe Checkout / mode démo
│   ├── mentions-legales/         Page légale
│   ├── confidentialite/          RGPD & cookies
│   ├── (auth)/                   login / register + actions (login, register, logout)
│   ├── compte/                   ESPACE MEMBRE (layout protégé)
│   │   ├── page.tsx              Tableau de bord : statut cotisation, événements, alertes docs
│   │   ├── evenements/           Inscription 1 clic + historique
│   │   ├── justificatifs/        Téléversement / consultation (certif. médical, assurance)
│   │   ├── parametres/           Données personnelles, reçu d'adhésion, RGPD
│   │   └── actions.ts            registerToEvent, updateProfile, uploadDocument…
│   ├── admin/                    BACK-OFFICE (layout réservé admin)
│   │   ├── page.tsx              Stats : membres actifs, cotisations perçues…
│   │   ├── membres/              Liste filtrable, validation adhésions + pièces jointes
│   │   ├── evenements/           CRUD événements
│   │   ├── spots/                CRUD spots
│   │   └── actions.ts            reviewDocument, setMembershipStatus, saveEvent, saveSpot…
│   └── api/
│       ├── uploads/[name]/       Sert les justificatifs (accès restreint)
│       ├── receipt/[id]/         Reçu d'adhésion imprimable
│       ├── admin/members/export/ Export CSV
│       └── stripe/webhook/       Confirmation de paiement
├── components/                   site-header (nav responsive), membership-form,
│                                 membership-status, app-nav, ui, action-button…
└── lib/                          prisma, session (JWT), auth (guards), validation (zod),
                                  stripe, uploads, queries, format
```

Détail des routes, du modèle de données et des flux (auth, paiement, upload) : **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Scripts

| Script            | Effet                                            |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | serveur de développement                         |
| `npm run build`   | `prisma generate` + build de production          |
| `npm run db:push` | synchronise le schéma sans migration             |
| `npm run db:migrate` | crée/applique une migration                    |
| `npm run db:seed` | données de démonstration                          |
| `npm run db:studio` | explorateur Prisma                             |

## Déploiement

Guide complet Vercel + Neon + Vercel Blob : **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Production — points d'attention

- **Uploads** : `UPLOADS_DRIVER=blob` (Vercel Blob) en prod — le driver `local` ne marche que sur ta machine. Voir `src/lib/uploads.ts`.
- **Reçu** : page HTML imprimable. Générer un vrai PDF archivé (`@react-pdf/renderer`) si besoin.
- **Renouvellements** : un cron doit passer les adhésions `active` échues en `expired` (l'affichage est déjà géré à la lecture via `getMembershipView`).
- **E-mails** : brancher un transactionnel (confirmation d'adhésion, rappel de renouvellement).
