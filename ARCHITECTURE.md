# Architecture — Deux saisons de planche

## 1. Stack & principes

| Couche        | Choix                                   | Raison                                             |
| ------------- | --------------------------------------- | ------------------------------------------------- |
| Framework     | Next.js 15 App Router, React 19, TS     | SSR, Server Actions, un seul déploiement          |
| Données       | PostgreSQL + Prisma                     | schéma typé, migrations, relations                |
| Auth          | Cookie httpOnly + JWT (`jose`), bcrypt  | sans dépendance lourde, contrôle total, RGPD-safe |
| Paiement      | Stripe Checkout (fallback « démo »)     | hébergé, PCI délégué ; HelloAsso possible en variante |
| Style         | CSS moderne + custom properties         | esthétique streetwear maîtrisée, zéro runtime CSS |
| Fichiers      | disque local (dev) → Vercel Blob (prod)  | justificatifs hors du bundle                    |

Règles de conception : layout en colonne unique, header collant à 3 liens + accès espace, une action par section, CTA ≥ 60 px, contraste noir/blanc pur.

## 2. Arborescence des routes

### Public
| URL | Contenu | Rendu |
|---|---|---|
| `/` | Hero, mission, 3 prochains événements | RSC, données live |
| `/evenements` | Agenda chronologique + spots (liste + carte placeholder) | RSC |
| `/adhesion` | À propos, valeurs, bureau, **formulaire d'adhésion/don** | RSC + form client |
| `/mentions-legales` | RNA, SIREN, siège, directeur de publication, hébergeur | statique |
| `/confidentialite` | RGPD, durées de conservation, cookies | statique |
| `/login`, `/register` | Auth | form client + server action |

### Espace membre — `/compte/*` (middleware + `requireUser`)
| URL | Fonction |
|---|---|
| `/compte` | Statut cotisation (active / à renouveler / expirée + date), compteurs, alertes justificatifs manquants, inscription 1 clic |
| `/compte/evenements` | Inscription/désinscription, **historique** |
| `/compte/justificatifs` | Téléversement + consultation (certificat médical, attestation d'assurance) + statut de validation |
| `/compte/parametres` | Modification des données perso, téléchargement du **reçu d'adhésion**, droits RGPD |

### Back-office — `/admin/*` (middleware role check + `requireAdmin`)
| URL | Fonction |
|---|---|
| `/admin` | Tableau de bord : membres actifs, cotisations perçues (Σ), adhésions/justificatifs à traiter, prochains événements |
| `/admin/membres` | Liste **filtrable** (recherche nom/e-mail + statut), validation des adhésions, validation/refus des pièces jointes avec motif, **export CSV** |
| `/admin/evenements` | **CRUD** événements (création, édition inline, suppression, publication) |
| `/admin/spots` | **CRUD** spots |

### API (route handlers)
| URL | Méthode | Rôle |
|---|---|---|
| `/api/documents/[id]` | GET | sert/redirige un justificatif — accès propriétaire ou admin uniquement |
| `/api/receipt/[id]` | GET | reçu d'adhésion HTML imprimable — propriétaire ou admin |
| `/api/admin/members/export` | GET | CSV des membres (admin) |
| `/api/stripe/webhook` | POST | `checkout.session.completed` → adhésion `active` |

## 3. Modèle de données (Prisma)

```
User (1)───(n) Membership          statut: pending | active | expired
  │                                 start/end date, amountCents, paymentId, receiptUrl
  ├──(n) EventRegistration (n)───(1) Event      unique(event,user) ; status registered|cancelled|attended
  └──(n) Document                   type: medical_certificate | insurance
                                     status: pending | approved | rejected ; note (motif refus)

Spot (indépendant)                  type: street | park | bowl ; lat/lng optionnels
```

Écarts vs. cahier des charges (assumés) :
- `Membership.amountCents` + `receiptUrl` ajoutés (suivi financier, reçu).
- **`Document`** promu en modèle dédié (le cahier des charges ne prévoyait qu'un `document_url` sur `Membership`, insuffisant pour 2 justificatifs + workflow de validation). `Membership.documentUrl` conservé pour compat.
- `Event.slug`, `capacity`, `published` ajoutés (ancre URL, jauge, brouillon).
- `EventRegistration.status` ajouté (annulation sans perdre l'historique).

Enums PostgreSQL natifs. Toutes les FK en `onDelete: Cascade`.

## 4. Authentification & autorisation

```
register / login  ──►  bcrypt.compare  ──►  createSession()
                                              └─ JWT HS256 { userId, role }, exp 30j
                                                 → cookie 2sdp_session (httpOnly, sameSite=lax, secure en prod)

middleware.ts        vérifie le JWT (Edge) sur /compte/* et /admin/* ; redirige /login?next=…
                     bloque /admin/* si role !== admin
layouts serveur      requireUser() / requireAdmin()  → source de vérité (relit l'utilisateur en base)
getCurrentUser()     cache() par rendu ; utilisé partout (header, guards, pages)
```

Pas de session serveur stockée : révocation = changer `AUTH_SECRET` ou raccourcir l'exp. Suffisant pour une association ; migration possible vers sessions en base si besoin de déconnexion à distance.

## 5. Flux d'adhésion (`submitMembership`)

```
Formulaire /adhesion
  │  zod validation (identité, montant, consentement RGPD)
  ▼
Utilisateur connecté ? ──non──►  création User (+ mot de passe) + createSession()
  │ oui
  ▼
création Membership { status: pending, endDate = today + 12 mois }
  │
  ├─ STRIPE_SECRET_KEY absente ──►  Membership.status = active   ──►  redirect /compte?welcome=1
  │
  └─ Stripe configuré ──►  checkout.sessions.create({ metadata.membershipId })
                            redirect vers Stripe
                                   │  paiement
                                   ▼
                            webhook checkout.session.completed
                                   ▼
                            Membership.status = active, paymentId = payment_intent
```

Variante **HelloAsso** : remplacer l'appel `stripe.checkout` par une redirection vers un formulaire HelloAsso + webhook `Order` (mêmes états `pending → active`).

## 6. Justificatifs

```
/compte/justificatifs  ──►  uploadDocument (server action, multipart)
                             storeUpload() : type ∈ {pdf,jpg,png}, ≤ 6 Mo
                             local → ./uploads/<uuid>.<ext>   |   blob → Vercel Blob (URL)
                             Document { url = clé de stockage, status: pending }
                                   │
Admin /admin/membres  ──►  reviewDocument(approved | rejected + note)  ──►  status, reviewedAt
Lecture  /api/documents/[id]  ──►  contrôle doc.userId === user.id || admin
                                   └─ url http(s) → redirect Blob ; sinon → stream fichier local
```

## 7. Statut de cotisation (`getMembershipView`)

Dérivé à la lecture, pas de job requis pour l'affichage :

| Condition | Statut | UI |
|---|---|---|
| aucune Membership | `none` | CTA « Adhérer » |
| `status = pending` | `pending` | « Reprendre le paiement » |
| `endDate` dépassée ou `status = expired` | `expired` | bannière + « Renouveler » |
| `endDate` < 30 jours | `expiring` | bannière pointillés + rappel |
| sinon | `active` | bannière noire + reçu téléchargeable |

Un cron de nuit (`setMembershipStatus`) peut matérialiser `expired` pour les stats admin.

## 8. RGPD / cookies

- **Un seul cookie** : `2sdp_session`, strictement nécessaire → exempté de consentement (art. 82).
- Aucun traceur tiers, aucune analytics externe.
- Bandeau = information + accusé de lecture stocké en `localStorage` (`2sdp_cookie_choice`), jamais transmis.
- Droits exercés par e-mail ; durées de conservation documentées sur `/confidentialite`.

## 9. Design system (`globals.css`)

Tokens : `--black/--white`, échelle typographique fluide `--step--1 … --step-4` (`clamp`), spacing `--space-*`, largeurs `--wrap` (46rem, colonne unique) / `--wrap-wide` (74rem).
Composants : `.site-header` (sticky, drawer mobile < 800px), `.btn` (≥ 60px, inversion au hover), `.ph` (placeholders média hachurés + variante sombre), `.event`, `.spot`, `.app-shell` (grille sidebar + contenu), `.card`, `.stat-grid`, `.status-banner`, `.badge`, `table.data`, `.toolbar`.
