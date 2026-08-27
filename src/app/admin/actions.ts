"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { eventSchema, spotSchema, fieldErrors } from "@/lib/validation";
import type { FormState } from "@/lib/action-types";

export type AdminState = FormState;

/* ---------- Validation des dossiers ---------- */

export async function reviewDocument(
  documentId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<AdminState> {
  await requireAdmin();
  await prisma.document.update({
    where: { id: documentId },
    data: { status: decision, note: note ?? null, reviewedAt: new Date() },
  });
  revalidatePath("/admin/membres");
  return { ok: true };
}

export async function setMembershipStatus(
  membershipId: string,
  status: "active" | "expired" | "pending",
): Promise<AdminState> {
  await requireAdmin();
  await prisma.membership.update({ where: { id: membershipId }, data: { status } });
  revalidatePath("/admin/membres");
  revalidatePath("/admin");
  return { ok: true };
}

/* ---------- CRUD Événements ---------- */

export async function saveEvent(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = formData.get("id")?.toString() || null;
  const raw = Object.fromEntries(formData);
  const parsed = eventSchema.safeParse({ ...raw, published: raw.published === "on" });
  if (!parsed.success) {
    return { ok: false, message: "Formulaire invalide.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  try {
    if (id) {
      await prisma.event.update({ where: { id }, data });
    } else {
      await prisma.event.create({ data });
    }
  } catch {
    return { ok: false, message: "Le slug est peut-être déjà utilisé." };
  }

  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
  return { ok: true, message: id ? "Événement mis à jour." : "Événement créé." };
}

export async function deleteEvent(id: string): Promise<AdminState> {
  await requireAdmin();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
  return { ok: true };
}

/* ---------- CRUD Spots ---------- */

export async function saveSpot(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = formData.get("id")?.toString() || null;
  const parsed = spotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Formulaire invalide.", errors: fieldErrors(parsed.error) };
  }

  if (id) {
    await prisma.spot.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.spot.create({ data: parsed.data });
  }

  revalidatePath("/admin/spots");
  revalidatePath("/evenements");
  return { ok: true, message: id ? "Spot mis à jour." : "Spot créé." };
}

export async function deleteSpot(id: string): Promise<AdminState> {
  await requireAdmin();
  await prisma.spot.delete({ where: { id } });
  revalidatePath("/admin/spots");
  revalidatePath("/evenements");
  return { ok: true };
}
