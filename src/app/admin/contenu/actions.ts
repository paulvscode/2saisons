"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteMedia, getContent, mediaUsage, saveContent, storeMedia, MEDIA_URL_PREFIX } from "@/lib/content";
import { CONTENT_SECTIONS, type SiteContent } from "@/lib/content-schema";
import type { FormState } from "@/lib/action-types";

function uploadedFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Sur Vercel, le disque est en lecture seule : content/ (textes + images du site) se modifie
 * en local, puis est publié par un push. Renvoie le message à afficher, ou null en local.
 */
function readOnlyOnline(): FormState | null {
  return process.env.VERCEL
    ? {
        ok: false,
        message:
          "Sur le site en ligne, les textes et images ne peuvent pas être enregistrés. Fais la modification sur ta version locale (localhost), puis publie-la avec un push.",
      }
    : null;
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

/** Enregistre tous les champs d'une section (textes + images, avec téléversement éventuel). */
export async function saveContentSection(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const blocked = readOnlyOnline();
  if (blocked) return blocked;
  const section = CONTENT_SECTIONS.find((s) => s.id === formData.get("section"));
  if (!section) return { ok: false, message: "Section inconnue." };

  const values: SiteContent = {};
  try {
    for (const [key, field] of Object.entries(section.fields)) {
      if (field.type === "image") {
        const file = uploadedFile(formData.get(`${key}__file`));
        values[key] = file ? await storeMedia(file) : String(formData.get(key) ?? "");
      } else if (field.type === "choice") {
        const value = String(formData.get(key) ?? "");
        values[key] = field.options?.some((o) => o.value === value) ? value : field.default;
      } else {
        values[key] = String(formData.get(key) ?? "").replace(/\r\n/g, "\n");
      }
    }
    await saveContent(values);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Enregistrement impossible." };
  }

  revalidateSite();
  return { ok: true, message: "Modifications enregistrées." };
}

/** Rétablit les textes et images par défaut d'une section. */
export async function resetContentSection(sectionId: string): Promise<FormState> {
  await requireAdmin();
  const blocked = readOnlyOnline();
  if (blocked) return blocked;
  const section = CONTENT_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return { ok: false, message: "Section inconnue." };
  await saveContent(Object.fromEntries(Object.entries(section.fields).map(([k, f]) => [k, f.default])));
  revalidateSite();
  return { ok: true, message: "Valeurs par défaut rétablies." };
}

/* ---------- Médiathèque ---------- */

export async function uploadMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const blocked = readOnlyOnline();
  if (blocked) return blocked;
  const files = formData.getAll("files").map(uploadedFile).filter((f): f is File => f !== null);
  if (files.length === 0) return { ok: false, message: "Choisis au moins une image." };

  try {
    for (const file of files) await storeMedia(file);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Téléversement impossible." };
  }

  revalidatePath("/admin/medias");
  revalidatePath("/admin/contenu");
  return { ok: true, message: files.length > 1 ? `${files.length} images ajoutées.` : "Image ajoutée." };
}

export async function removeMedia(name: string): Promise<FormState> {
  await requireAdmin();
  const blocked = readOnlyOnline();
  if (blocked) return blocked;
  const usage = mediaUsage(await getContent(), MEDIA_URL_PREFIX + name);
  if (usage.length > 0) {
    return { ok: false, message: `Utilisée par : ${usage.map((u) => u.label).join(", ")}.` };
  }
  try {
    await deleteMedia(name);
  } catch {
    return { ok: false, message: "Suppression impossible." };
  }
  revalidatePath("/admin/medias");
  revalidatePath("/admin/contenu");
  return { ok: true };
}
