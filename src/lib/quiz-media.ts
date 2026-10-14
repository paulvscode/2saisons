import "server-only";
import sharp, { type OutputInfo } from "sharp";
import { prisma } from "./prisma";

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo à l'envoi (l'image stockée est bien plus légère)
const MAX_SIDE = 1600; // px, plus grand côté après redimensionnement
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const URL_PREFIX = "/api/images/";

/**
 * Images des quiz (couverture et questions). Les quiz s'éditent sur le site en ligne, dont le
 * disque est en lecture seule : les images sont redimensionnées, compressées en WebP et stockées
 * dans Postgres (table stored_images), servies par /api/images/[id].
 * Suffisant pour un trafic modeste ; à remplacer par un stockage objet (Vercel Blob, R2…) si besoin.
 */
export async function storeQuizImage(file: File): Promise<string> {
  if (!ACCEPTED.has(file.type)) {
    throw new Error(`« ${file.name} » : format accepté JPEG, PNG, WebP, GIF ou AVIF.`);
  }
  if (file.size > MAX_BYTES) throw new Error(`« ${file.name} » : 8 Mo maximum.`);

  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()), { animated: file.type === "image/gif" })
      .rotate() // orientation EXIF des photos de téléphone
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new Error(`« ${file.name} » : image illisible.`);
  }

  const image = await prisma.storedImage.create({
    data: {
      data: new Uint8Array(output.data),
      mime: "image/webp",
      width: output.info.width,
      height: output.info.pageHeight ?? output.info.height,
    },
    select: { id: true },
  });
  return URL_PREFIX + image.id;
}

/** Supprime une image remplacée ou retirée (images en base, et anciennes images Vercel Blob). */
export async function discardQuizImage(url: string | null | undefined) {
  if (!url) return;
  if (url.startsWith(URL_PREFIX)) {
    await prisma.storedImage.deleteMany({ where: { id: url.slice(URL_PREFIX.length) } });
    return;
  }
  if (/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
    } catch {
      // Sans gravité : l'image orpheline n'est plus référencée.
    }
  }
}

/** Fichier image envoyé par un formulaire (champ vide = aucun fichier). */
export function formImage(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}
