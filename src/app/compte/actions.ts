"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { storeUpload } from "@/lib/uploads";
import { documentSchema, fieldErrors, profileSchema } from "@/lib/validation";
import type { FormState } from "@/lib/action-types";

export type ActionState = FormState;

export async function registerToEvent(eventId: string): Promise<ActionState> {
  const user = await requireUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event || !event.published) return { ok: false, message: "Événement introuvable." };
  if (event.date.getTime() < Date.now()) return { ok: false, message: "Cet événement est passé." };
  if (event.capacity && event._count.registrations >= event.capacity) {
    return { ok: false, message: "Cet événement est complet." };
  }

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { status: "registered" },
    create: { eventId, userId: user.id },
  });

  revalidatePath("/compte");
  revalidatePath("/compte/evenements");
  return { ok: true, message: "Inscription confirmée." };
}

export async function unregisterFromEvent(eventId: string): Promise<ActionState> {
  const user = await requireUser();
  await prisma.eventRegistration.updateMany({
    where: { eventId, userId: user.id },
    data: { status: "cancelled" },
  });
  revalidatePath("/compte");
  revalidatePath("/compte/evenements");
  return { ok: true, message: "Inscription annulée." };
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/compte/parametres");
  return { ok: true, message: "Informations mises à jour." };
}

export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = documentSchema.safeParse({ type: formData.get("type") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choisis un fichier à téléverser." };
  }

  try {
    const stored = await storeUpload(file);
    await prisma.document.create({
      data: {
        userId: user.id,
        type: parsed.data.type,
        url: stored.key,
        filename: stored.filename,
      },
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Échec du téléversement." };
  }

  revalidatePath("/compte/justificatifs");
  revalidatePath("/compte");
  return { ok: true, message: "Justificatif envoyé. Il sera validé par un·e responsable." };
}

export async function deleteDocument(documentId: string): Promise<ActionState> {
  const user = await requireUser();
  await prisma.document.deleteMany({ where: { id: documentId, userId: user.id } });
  revalidatePath("/compte/justificatifs");
  return { ok: true };
}
