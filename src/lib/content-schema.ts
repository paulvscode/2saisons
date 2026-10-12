/**
 * Registre des contenus éditables du site (textes + images).
 * Chaque champ a une valeur par défaut ; les valeurs modifiées depuis /admin/contenu
 * sont enregistrées dans content/site.json (hors base de données).
 * Pour rendre un nouveau texte éditable : l'ajouter ici, puis le lire via getContent().
 */

export type ContentFieldType = "text" | "textarea" | "image";

export type ContentField = {
  label: string;
  type: ContentFieldType;
  default: string;
  hint?: string;
};

export type ContentSection = {
  id: string;
  title: string;
  /** Page publique où apparaît la section (lien « Voir » dans l'admin). */
  href: string;
  fields: Record<string, ContentField>;
};

const text = (label: string, value: string, hint?: string): ContentField => ({
  label,
  type: "text",
  default: value,
  hint,
});
const area = (label: string, value: string, hint?: string): ContentField => ({
  label,
  type: "textarea",
  default: value,
  hint,
});
const image = (label: string, value = "", hint?: string): ContentField => ({
  label,
  type: "image",
  default: value,
  hint,
});

const VALUES = [
  ["Accessible", "Créneaux gratuits ou à petit prix, prêt de matériel, aucun niveau requis."],
  ["Transmission", "Les plus expérimentés accompagnent les nouveaux, sans hiérarchie."],
  ["Respect", "Des lieux, des riverains, des autres pratiques. On laisse les spots propres."],
  ["Culture", "Le skate, c'est aussi la vidéo, la musique, le graphisme, le DIY."],
  ["Autonomie", "Réparer, construire, s'organiser collectivement plutôt que consommer."],
  ["Inclusif", "Toutes et tous bienvenus, quel que soit l'âge, le genre ou le parcours."],
];

const BOARD = ["Présidence", "Trésorerie", "Secrétariat & événements"];

/** Mission : un axe = un titre, une intro (facultative) et des points (un par ligne). */
const MISSION = [
  [
    "Améliorer la cohabitation",
    "",
    [
      "Partager l’espace : concertations visant à concevoir les aménagements nécessaires à la coexistence avec les usagers, à l'image des villes de Lyon (Place Louis Pradel), Paris (République), Bordeaux (Mériadeck), ou encore Malmö en Suède.",
      "Mobiliser la communauté : s’appuyer sur le dynamisme et l’engagement de la communauté pour faire vivre et respecter cette coexistence.",
      "Structurer les événements : intégration de l’USC (Ultra Skate Club, référent auprès de la fédération) pour l’organisation de compétitions officielles.",
      "Faire rayonner la ville : afficher une image forte et moderne grâce à des projets culturels et urbains à résonance nationale et supranationale (œuvres skatables, festivals, expositions).",
    ],
  ],
  [
    "Développer des projets",
    "",
    [
      "Cartographier les lieux de pratique : améliorer le guide des spots existant sous la forme d'une carte interactive intégrant les usages, à l'image de la démarche bordelaise.",
      "Intégrer du mobilier urbain sur mesure : installer des modules in situ (bancs, barres à slide, tremplins, bosses) conçus comme des œuvres d'art parfaitement fondues dans l'architecture de la ville.",
      "Valoriser l'existant à moindre coût : réhabiliter le mobilier inexploité par la municipalité et rénover les infrastructures actuelles pour créer un fort impact visuel avec un budget maîtrisé.",
      "Organiser des événements culturels et sportifs : proposer des festivals, de la médiation et du coaching mettant en valeur l'image d'une ville jeune et dynamique, en croisant les compétences locales (urbanisme, sport, culture, communication).",
    ],
  ],
  [
    "Participer aux projets de développement institutionnels du skate",
    "",
    [
      "Accompagner les engagements municipaux : conseiller la ville dans la concrétisation de son programme (réfection du skatepark actuel ou création d'un skatepark couvert).",
    ],
  ],
] as const;

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: "global",
    title: "Informations générales",
    href: "/mentions-legales",
    fields: {
      "site.email": text("E-mail de contact", "contact@deuxsaisonsdeplanche.fr"),
      "site.address": text("Siège social", "00 rue de l'Exemple, 00000 Ville"),
      "site.rna": text("Numéro RNA", "W000000000"),
      "site.siren": text("SIREN", "000 000 000"),
      "site.siret": text("SIRET", "000 000 000 00000"),
      "site.host": area(
        "Hébergeur",
        "[Nom de l'hébergeur], [adresse de l'hébergeur], [téléphone].",
        "Affiché dans les mentions légales.",
      ),
    },
  },
  {
    id: "home-hero",
    title: "Accueil — Hero",
    href: "/",
    fields: {
      "home.hero.image": image("Photo principale", "/media/hero.jpg", "Paysage, ~1600×1000."),
      "home.hero.imageAlt": text("Description de la photo (accessibilité)", "Skateur en plein grind sur un curb"),
      "home.hero.eyebrow": text("Surtitre", "Association loi 1901"),
      "home.hero.title": text("Titre", "Deux saisons de planche"),
      "home.hero.mission": area("Mission", "Promouvoir la pratique du skateboard et la culture associée."),
      "home.hero.cta": text("Bouton", "Rejoindre l'association"),
    },
  },
  {
    id: "home-events",
    title: "Accueil — Prochains rendez-vous",
    href: "/",
    fields: {
      "home.events.eyebrow": text("Surtitre", "Prochainement"),
      "home.events.title": text("Titre (avec événements)", "Les prochains rendez-vous"),
      "home.events.emptyTitle": text("Titre (sans événement)", "Agenda en préparation"),
      "home.events.empty": area(
        "Texte (sans événement)",
        "Les prochaines sessions sont en cours de calage. Reviens vite ou adhère pour être prévenu·e.",
      ),
      "home.events.cta": text("Bouton", "Voir tous les événements & spots"),
    },
  },
  {
    id: "events",
    title: "Événements & Spots",
    href: "/evenements",
    fields: {
      "events.title": text("Titre de la page", "Événements & Spots"),
      "events.map.query": text(
        "Lieu affiché sur la carte",
        "Le Havre, France",
        "Ce qu'on taperait dans Google Maps (ville, adresse, lieu).",
      ),
      "events.links.title": text("Titre — liens", "Inspirations"),
      "events.links": area(
        "Liens",
        [
          "Bordeaux, capitale du skate-urbanisme | https://www.bordeaux-tourisme.com/skate-urbanisme",
          "Nantes : une charte de bonne pratique pour les riders | https://metropole.nantes.fr/actualites/skate-une-charte-de-bonne-pratique-pour-les-riders-nantais",
          "Connect, festival du skate-urbanisme — le programme | https://connect-skaturbanism-festival.com/programme/",
          "Malmö, la ville du skate devenue adulte (en anglais) | https://urbannext.net/the-grown-up-skateboarding-city-of-malmo/",
        ].join("\n"),
        "Un lien par ligne : Titre | https://…",
      ),
    },
  },
  {
    id: "mission",
    title: "Mission",
    href: "/mission",
    fields: {
      "mission.eyebrow": text("Surtitre", "Mission"),
      "mission.title": text("Titre de la page", "Notre objectif"),
      "mission.intro": area(
        "Intro de la page",
        "Le skateboard a évolué. La pratique est maintenant un sport intégré aux Jeux Olympiques mais garde un ancrage profond dans l’espace urbain. Cette dualité offre une opportunité unique de développer une cohabitation entre usagers et pratiquants tout en créant une image de marque forte pour la ville.",
        "Facultatif.",
      ),
      ...Object.fromEntries(
        MISSION.flatMap(([title, intro, points], i) => [
          [`mission.${i + 1}.title`, text(`Axe ${i + 1} — titre`, title)],
          [`mission.${i + 1}.intro`, area(`Axe ${i + 1} — intro`, intro, "Facultatif.")],
          [
            `mission.${i + 1}.points`,
            area(`Axe ${i + 1} — points`, points.join("\n"), "Un point par ligne. « Libellé : texte » met le libellé en gras."),
          ],
        ]),
      ),
    },
  },
  {
    id: "usc",
    title: "USC — Ultra Skate Club",
    href: "/usc",
    fields: {
      "usc.eyebrow": text("Surtitre", "Ultra Skate Club"),
      "usc.title": text("Titre de la page", "USC"),
      "usc.intro.title": text("Titre — présentation", "Un club, des cours, une progression"),
      "usc.intro.lead": area(
        "Chapeau",
        "L'Ultra Skate Club (USC) est un club de skate qui propose des cours de skateboard encadrés, du premier push aux premiers tricks.",
      ),
      "usc.intro.text": area(
        "Texte",
        "Séances collectives ou individuelles, tous âges et tous niveaux : l'USC accompagne celles et ceux qui veulent apprendre, se remettre en selle ou passer un cap, dans le même esprit que « Deux saisons de planche » — accessible, sans pression, orienté plaisir.",
      ),
      "usc.image": image("Photo", "", "16:9. Vide = placeholder."),
      "usc.imageAlt": text("Description de la photo", "Cours de skateboard de l'Ultra Skate Club"),
      "usc.cta.eyebrow": text("Surtitre — inscriptions", "S'inscrire aux cours"),
      "usc.cta.title": area("Titre — inscriptions", "Toutes les infos et les inscriptions sur le site de l'USC"),
      "usc.cta.text": area(
        "Texte — inscriptions",
        "Planning des cours, tarifs et formulaire d'inscription sont gérés directement par l'Ultra Skate Club.",
      ),
      "usc.cta.url": text("Lien du site USC", "https://www.ultraskateclub.com/"),
      "usc.cta.button": text("Bouton", "Aller sur ultraskateclub.com"),
      "usc.contact": text("Phrase de contact", "Une question sur le lien entre l'USC et l'association ?"),
    },
  },
  {
    id: "about",
    title: "À propos — L'association",
    href: "/adhesion",
    fields: {
      "about.eyebrow": text("Surtitre", "Qui roule, pourquoi, comment nous rejoindre"),
      "about.title": text("Titre de la page", "À propos & Adhésion"),
      "about.intro.title": text("Titre — association", "L'association"),
      "about.intro.lead": area(
        "Chapeau",
        "Deux saisons de planche est née de l'envie de skater ensemble toute l'année, quel que soit le temps — une saison dehors, une saison à l'abri.",
      ),
      "about.intro.text": area(
        "Texte",
        "Nous sommes un collectif de riders bénévoles. Nous ouvrons des créneaux encadrés, entretenons les spots, accompagnons les débutants et faisons circuler la culture skate. Pas de sélection : si tu poses un pied sur une planche, tu as ta place.",
      ),
      "about.image": image("Photo de l'équipe", "", "16:9. Vide = placeholder."),
      "about.imageAlt": text("Description de la photo", "Portrait de groupe des membres de l'association"),
    },
  },
  {
    id: "about-values",
    title: "À propos — Valeurs",
    href: "/adhesion",
    fields: {
      "about.values.title": text("Titre", "Nos valeurs"),
      ...Object.fromEntries(
        VALUES.flatMap(([t, d], i) => [
          [`about.values.${i + 1}.title`, text(`Valeur ${i + 1} — titre`, t)],
          [`about.values.${i + 1}.text`, area(`Valeur ${i + 1} — texte`, d)],
        ]),
      ),
    },
  },
  {
    id: "about-board",
    title: "À propos — Bureau",
    href: "/adhesion",
    fields: {
      "about.board.title": text("Titre", "Le bureau"),
      ...Object.fromEntries(
        BOARD.flatMap((role, i) => [
          [`about.board.${i + 1}.photo`, image(`Membre ${i + 1} — portrait`, "", "Carré. Vide = placeholder.")],
          [`about.board.${i + 1}.name`, text(`Membre ${i + 1} — nom`, "Prénom Nom")],
          [`about.board.${i + 1}.role`, text(`Membre ${i + 1} — rôle`, role)],
        ]),
      ),
    },
  },
  {
    id: "about-join",
    title: "À propos — Adhésion",
    href: "/adhesion#adherer",
    fields: {
      "about.join.eyebrow": text("Surtitre", "Une action, maintenant"),
      "about.join.title": text("Titre", "Adhérer ou faire un don"),
      "about.join.text": area(
        "Texte (visiteur non connecté)",
        "Quelques champs, deux minutes. Ton espace membre est créé automatiquement.",
      ),
    },
  },
  {
    id: "footer",
    title: "Pied de page",
    href: "/",
    fields: {
      "footer.title": area("Titre", "Roule\navec nous", "Un retour à la ligne = un saut de ligne."),
      "footer.text": area(
        "Texte",
        "Deux saisons de planche — association pour la pratique et la culture du skateboard.",
      ),
    },
  },
];

export type SiteContent = Record<string, string>;

export const CONTENT_FIELDS: Record<string, ContentField> = Object.fromEntries(
  CONTENT_SECTIONS.flatMap((s) => Object.entries(s.fields)),
);

export const VALUE_COUNT = VALUES.length;
export const BOARD_COUNT = BOARD.length;
export const MISSION_COUNT = MISSION.length;
