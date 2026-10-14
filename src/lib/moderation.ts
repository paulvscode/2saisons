/**
 * Filtre des pseudos publics (classement du quiz) : insultes, propos racistes, haineux ou sexuels,
 * en français et en anglais. Déjoue les contournements courants : accents, majuscules, leetspeak
 * (c0nn4rd), séparateurs (c.o.n.n.a.r.d) et lettres doublées (connnnard).
 * Un filtre par liste n'est jamais parfait : l'admin peut supprimer une participation du classement.
 */

/** Termes recherchés n'importe où dans le pseudo (assez longs pour ne pas créer de faux positifs). */
const ANYWHERE = [
  // FR — insultes
  "connard", "connasse", "salope", "salaud", "encule", "enculer", "batard", "putain", "pouffiasse",
  "petasse", "merde", "branleur", "branleuse", "couille", "trouducul", "niquer", "suceuse",
  "fils de pute", "filsdepute", "ta mere", "tamere", "nichon", "abruti", "debile", "mongol",
  // FR — racisme, haine
  "negre", "negresse", "bougnoul", "youpin", "youtre", "bicot", "chinetoque", "chintok", "niakoue",
  "sale arabe", "sale noir", "sale juif", "sale blanc", "sale chinois", "sale renoi", "sale rebeu",
  "hitler", "siegheil", "sieg heil", "heil", "facho", "gestapo", "auschwitz", "shoah",
  "tapette", "gouine", "travelo",
  // EN
  "fuck", "fuk", "shit", "bitch", "nigger", "nigga", "faggot", "whore", "slut", "porn",
  "pussy", "asshole", "bastard", "motherf", "wetback", "tranny", "kike", "rapist",
  "kill all", "white power", "whitepower",
];

/** Termes courts, refusés seulement s'ils forment un mot entier (ex. « pute », pas « réputé »). */
const WHOLE_WORD = [
  "pute", "putes", "pd", "pede", "fdp", "ntm", "tg", "nik", "nique", "bite", "cul", "chier", "con", "conne",
  "cons", "suce", "sucer", "raton", "bamboula", "kkk", "nazi", "cunt", "fag", "dick", "cock", "rape",
  "chink", "spic", "paki", "twat", "wank", "sex", "sexe", "anal", "nazis",
];

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i", "€": "e",
};

/** Minuscules, sans accents, leetspeak converti, lettres répétées réduites. */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[013457@$!€]/g, (ch) => LEET[ch] ?? ch)
    .replace(/(.)\1+/g, "$1");
}

/** Version sans séparateurs : « c.o-n n a r d » -> « conard ». */
const compact = (text: string) =>
  normalize(text)
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");

const ANYWHERE_N = ANYWHERE.map(compact);
const WHOLE_WORD_N = new Set(WHOLE_WORD.map(compact));

export function isOffensive(name: string) {
  const flat = compact(name);
  if (ANYWHERE_N.some((term) => flat.includes(term))) return true;
  if (WHOLE_WORD_N.has(flat)) return true;
  const words = normalize(name).split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => WHOLE_WORD_N.has(w));
}

/** Valide un pseudo de classement. Renvoie un message d'erreur, ou null s'il est accepté. */
export function validatePlayerName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Ton pseudo doit faire au moins 2 caractères.";
  if (name.length > 24) return "Ton pseudo doit faire 24 caractères maximum.";
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(name)) {
    return "Lettres, chiffres, espaces et . _ ' - uniquement.";
  }
  if (/https?|www\.|\.(com|fr|net|org)\b/i.test(name)) return "Pas de lien dans le pseudo.";
  if (isOffensive(name)) return "Ce pseudo n'est pas accepté. Choisis-en un autre, respectueux.";
  return null;
}
