import "server-only";
import { randomBytes } from "node:crypto";
import { storeMedia } from "./content";

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Images des quiz (couverture et questions). Les quiz s'éditent sur le site en ligne,
 * dont le disque est en lecture seule : en prod (UPLOADS_DRIVER=blob) elles vont sur
 * Vercel Blob ; en local, dans content/media comme les autres images.
 */
export async function storeQuizImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error(`« ${file.name} » : format accepté JPEG, PNG, WebP, GIF ou AVIF.`);
  if (file.size > MAX_BYTES) throw new Error(`« ${file.name} » : 8 Mo maximum.`);

  if ((process.env.UPLOADS_DRIVER ?? "local") === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`quiz/${randomBytes(8).toString("hex")}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return blob.url;
  }
  return storeMedia(file);
}

/** Supprime une ancienne image Blob remplacée (les fichiers locaux restent dans la médiathèque). */
export async function discardQuizImage(url: string | null | undefined) {
  if (!url || !/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url)) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // Sans gravité : l'image orpheline n'est plus référencée.
  }
}

/** Fichier image envoyé par un formulaire (champ vide = aucun fichier). */
export function formImage(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}
