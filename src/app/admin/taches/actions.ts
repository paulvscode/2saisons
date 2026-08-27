"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fieldErrors } from "@/lib/validation";
import type { FormState } from "@/lib/action-types";
import { TASK_STATUSES, type TaskStatus } from "./columns";

const createSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
});

export async function createTask(formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Titre requis.", errors: fieldErrors(parsed.error) };
  }

  const last = await prisma.task.aggregate({
    where: { status: parsed.data.status },
    _max: { position: true },
  });

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      position: (last._max.position ?? -1) + 1,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/taches");
  return { ok: true };
}

/**
 * Déplace une tâche : nouvelle colonne + position devant `beforeTaskId`
 * (ou en fin de colonne si null). Réindexe la colonne cible.
 */
export async function moveTask(
  taskId: string,
  status: TaskStatus,
  beforeTaskId: string | null,
): Promise<FormState> {
  await requireAdmin();
  if (!TASK_STATUSES.includes(status)) return { ok: false, message: "Statut invalide." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, message: "Tâche introuvable." };

  const column = await prisma.task.findMany({
    where: { status, id: { not: taskId } },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const targetIndex =
    beforeTaskId != null
      ? column.findIndex((t) => t.id === beforeTaskId)
      : column.length;
  const at = targetIndex === -1 ? column.length : targetIndex;

  const orderedIds = [
    ...column.slice(0, at).map((t) => t.id),
    taskId,
    ...column.slice(at).map((t) => t.id),
  ];

  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.task.update({ where: { id }, data: { position: i, status } }),
    ),
  );

  revalidatePath("/admin/taches");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/admin/taches");
  return { ok: true };
}
