import "server-only";
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { trimSvgLogo } from "./svg-trim";
import { CONTENT_FIELDS, CONTENT_SECTIONS, type SiteContent } from "./content-schema";

/**
 * Contenus du site stockés sur disque, hors base de données :
 *   content/site.json   valeurs modifiées depuis l'admin (clé -> texte ou URL d'image)
 *   content/media/      images téléversées, servies par /media/<fichier>
 * Le disque de Vercel est éphémère et en lecture seule : éditer en local puis committer `content/`.
 */
const CONTENT_DIR = join(process.cwd(), "content");
const CONTENT_FILE = join(CONTENT_DIR, "site.json");
export const MEDIA_DIR = join(CONTENT_DIR, "media");
export const MEDIA_URL_PREFIX = "/media/";

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const MEDIA_MIME: Record<string, string> = {
  svg: "image/svg+xml", // uniquement produit par la conversion des fichiers Illustrator
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};
export const MEDIA_ACCEPT = Object.keys(IMAGE_TYPES).join(",");
/** Champs vectoriels (logo) : accepte aussi les fichiers Adobe Illustrator. */
export const MEDIA_ACCEPT_VECTOR = `${MEDIA_ACCEPT},.ai,application/postscript,application/illustrator,application/pdf`;

const AI_MAX_BYTES = 30 * 1024 * 1024; // 30 Mo
const execFileAsync = promisify(execFile);

/** Nom de fichier média sûr (pas de chemin, extension image connue). */
export function isMediaName(name: string) {
  return /^[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp|gif|avif|svg)$/.test(name);
}

/** Favicon PNG produit à côté d'un logo SVG converti depuis Illustrator. */
export const faviconPngFor = (svgUrl: string) => svgUrl.replace(/\.svg$/, ".png");

/* ---------- Textes ---------- */

async function readOverrides(): Promise<SiteContent> {
  try {
    return JSON.parse(await readFile(CONTENT_FILE, "utf8"));
  } catch {
    return {};
  }
}

/** Contenu complet : valeurs par défaut du registre, surchargées par content/site.json. */
export async function getContent(): Promise<SiteContent> {
  const overrides = await readOverrides();
  const content: SiteContent = {};
  for (const [key, field] of Object.entries(CONTENT_FIELDS)) {
    content[key] = typeof overrides[key] === "string" ? overrides[key] : field.default;
  }
  return content;
}

/** Enregistre des valeurs (écriture atomique). Les clés inconnues du registre sont ignorées. */
export async function saveContent(values: SiteContent) {
  const current = await readOverrides();
  for (const [key, value] of Object.entries(values)) {
    if (key in CONTENT_FIELDS) current[key] = value;
  }
  await mkdir(CONTENT_DIR, { recursive: true });
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(current, null, 2) + "\n");
  await rename(tmp, CONTENT_FILE);
}

/* ---------- Médias ---------- */

export type MediaItem = { name: string; url: string; size: number; updatedAt: Date };

export async function listMedia(): Promise<MediaItem[]> {
  let names: string[];
  try {
    names = await readdir(MEDIA_DIR);
  } catch {
    return [];
  }
  const items = await Promise.all(
    names.filter(isMediaName).map(async (name) => {
      const s = await stat(join(MEDIA_DIR, name));
      return { name, url: MEDIA_URL_PREFIX + name, size: s.size, updatedAt: s.mtime };
    }),
  );
  return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function slugify(filename: string) {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

/** pdftocairo (poppler) : dans le PATH, sinon emplacements Homebrew habituels. */
async function pdftocairo(args: string[]) {
  const candidates = ["pdftocairo", "/opt/homebrew/bin/pdftocairo", "/usr/local/bin/pdftocairo"];
  for (const bin of candidates) {
    try {
      return await execFileAsync(bin, args, { timeout: 60_000 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  throw new Error(
    "Conversion impossible : l'outil pdftocairo est absent. Installe-le avec « brew install poppler ».",
  );
}

/**
 * Fichier Adobe Illustrator (.ai) : enregistré en SVG (logo net à toute taille), recadré sur le
 * dessin (marges du plan de travail retirées), et en PNG transparent 512 px (favicon).
 * Nécessite un .ai « compatible PDF » (option par défaut d'Illustrator).
 */
async function storeIllustrator(file: File): Promise<string> {
  if (file.size > AI_MAX_BYTES) throw new Error(`« ${file.name} » : 30 Mo maximum.`);
  const data = Buffer.from(await file.arrayBuffer());
  if (data.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error(
      `« ${file.name} » n'est pas compatible PDF. Dans Illustrator : Fichier › Enregistrer sous… › cocher « Créer un fichier compatible PDF ».`,
    );
  }

  const base = `${slugify(file.name)}-${randomBytes(3).toString("hex")}`;
  const work = await mkdtemp(join(tmpdir(), "2sdp-ai-"));
  try {
    const src = join(work, "source.pdf");
    await writeFile(src, data);
    await mkdir(MEDIA_DIR, { recursive: true });
    // Première planche de travail uniquement.
    await pdftocairo(["-svg", "-f", "1", "-l", "1", src, join(MEDIA_DIR, `${base}.svg`)]);
    await trimSvgLogo(join(MEDIA_DIR, `${base}.svg`), join(MEDIA_DIR, `${base}.png`));
  } catch (e) {
    await rm(join(MEDIA_DIR, `${base}.svg`), { force: true });
    await rm(join(MEDIA_DIR, `${base}.png`), { force: true });
    if (e instanceof Error && e.message.startsWith("Conversion impossible")) throw e;
    throw new Error(`« ${file.name} » : conversion du fichier Illustrator impossible.`);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
  return `${MEDIA_URL_PREFIX}${base}.svg`;
}

/** Enregistre une image dans content/media et renvoie son URL publique (/media/…). */
export async function storeMedia(file: File): Promise<string> {
  if (/\.ai$/i.test(file.name)) return storeIllustrator(file);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error(`« ${file.name} » : format accepté JPEG, PNG, WebP, GIF ou AVIF.`);
  if (file.size > MAX_BYTES) throw new Error(`« ${file.name} » : 8 Mo maximum.`);

  const name = `${slugify(file.name)}-${randomBytes(3).toString("hex")}.${ext}`;
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(join(MEDIA_DIR, name), Buffer.from(await file.arrayBuffer()));
  return MEDIA_URL_PREFIX + name;
}

export async function deleteMedia(name: string) {
  if (!isMediaName(name)) throw new Error("Nom de fichier invalide.");
  await unlink(join(MEDIA_DIR, name));
}

/** Le PNG de favicon existe-t-il à côté de ce logo SVG ? */
export async function hasFaviconPng(svgUrl: string) {
  if (!svgUrl.endsWith(".svg")) return false;
  try {
    await access(join(MEDIA_DIR, faviconPngFor(svgUrl).slice(MEDIA_URL_PREFIX.length)));
    return true;
  } catch {
    return false;
  }
}

/** Emplacements du site qui utilisent une image donnée (y compris comme favicon d'un logo SVG). */
export function mediaUsage(content: SiteContent, url: string) {
  return CONTENT_SECTIONS.flatMap((s) =>
    Object.entries(s.fields).flatMap(([key, f]) => {
      if (f.type !== "image" || !content[key]) return [];
      if (content[key] === url) return [{ key, label: `${s.title} › ${f.label}` }];
      if (content[key].endsWith(".svg") && faviconPngFor(content[key]) === url) {
        return [{ key, label: `${s.title} › ${f.label} (favicon)` }];
      }
      return [];
    }),
  );
}
