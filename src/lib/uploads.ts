import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_BYTES = 6 * 1024 * 1024; // 6 Mo
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type StoredFile = {
  /** Clé de stockage : nom de fichier local (driver "local") ou URL complète (driver "blob"). */
  key: string;
  filename: string;
};

function extFor(type: string) {
  return type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg";
}

function assertValid(file: File) {
  if (!ALLOWED.has(file.type)) throw new Error("Format accepté : PDF, JPEG ou PNG.");
  if (file.size > MAX_BYTES) throw new Error("Fichier trop volumineux (6 Mo maximum).");
}

/**
 * Stocke un justificatif.
 * - "local" (dev)  : écrit dans ./uploads (le disque de Vercel est éphémère : à ne pas utiliser en prod).
 * - "blob" (prod)  : Vercel Blob — nécessite le package @vercel/blob et BLOB_READ_WRITE_TOKEN.
 * La lecture passe toujours par /api/documents/[id], qui contrôle l'accès (propriétaire ou admin).
 */
export async function storeUpload(file: File): Promise<StoredFile> {
  assertValid(file);
  const driver = process.env.UPLOADS_DRIVER ?? "local";
  const name = `${randomUUID()}.${extFor(file.type)}`;

  if (driver === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`justificatifs/${name}`, file, {
      access: "public", // URL non devinable ; l'accès applicatif reste filtré par /api/documents/[id]
      addRandomSuffix: false,
      contentType: file.type,
    });
    return { key: blob.url, filename: file.name };
  }

  if (driver === "local") {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return { key: name, filename: file.name };
  }

  throw new Error(`UPLOADS_DRIVER inconnu : "${driver}".`);
}

export { UPLOAD_DIR };
