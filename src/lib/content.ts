import "server-only";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
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
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};
export const MEDIA_ACCEPT = Object.keys(IMAGE_TYPES).join(",");

/** Nom de fichier média sûr (pas de chemin, extension image connue). */
export function isMediaName(name: string) {
  return /^[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp|gif|avif)$/.test(name);
}

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

/** Enregistre une image dans content/media et renvoie son URL publique (/media/…). */
export async function storeMedia(file: File): Promise<string> {
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

/** Emplacements du site qui utilisent une image donnée. */
export function mediaUsage(content: SiteContent, url: string) {
  return CONTENT_SECTIONS.flatMap((s) =>
    Object.entries(s.fields)
      .filter(([key, f]) => f.type === "image" && content[key] === url)
      .map(([key, f]) => ({ key, label: `${s.title} › ${f.label}` })),
  );
}
