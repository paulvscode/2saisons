"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/action-types";

function revalidateQuiz(quizId?: string) {
  revalidatePath("/admin/quiz");
  if (quizId) revalidatePath(`/admin/quiz/${quizId}`);
  revalidatePath("/quiz");
}

/* ---------- Quiz ---------- */

const quizSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(160),
  description: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null),
  published: z.boolean(),
});

/** Crée ou met à jour un quiz. Publier un quiz retire les autres de /quiz. */
export async function saveQuiz(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = formData.get("id")?.toString() || null;
  const parsed = quizSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: "Formulaire invalide.", errors: { title: parsed.error.issues[0]?.message } };
  }

  const quiz = await prisma.$transaction(async (tx) => {
    if (parsed.data.published) {
      await tx.quiz.updateMany({ where: { published: true, NOT: id ? { id } : undefined }, data: { published: false } });
    }
    return id
      ? tx.quiz.update({ where: { id }, data: parsed.data })
      : tx.quiz.create({ data: parsed.data });
  });

  revalidateQuiz(quiz.id);
  if (!id) redirect(`/admin/quiz/${quiz.id}`);
  return { ok: true, message: "Quiz enregistré." };
}

export async function deleteQuiz(id: string): Promise<FormState> {
  await requireAdmin();
  await prisma.quiz.delete({ where: { id } });
  revalidateQuiz();
  redirect("/admin/quiz");
}

/* ---------- Questions ---------- */

/**
 * Crée ou met à jour une question et ses réponses.
 * Champs : text, answer.<n>.text, answer.<n>.correct (case cochée).
 */
export async function saveQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const quizId = formData.get("quizId")?.toString() ?? "";
  const id = formData.get("id")?.toString() || null;
  const text = formData.get("text")?.toString().trim() ?? "";

  const answers: { text: string; isCorrect: boolean }[] = [];
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^answer\.(\d+)\.text$/);
    if (!m) continue;
    const answerText = value.toString().trim();
    if (answerText) {
      answers.push({ text: answerText, isCorrect: formData.get(`answer.${m[1]}.correct`) === "on" });
    }
  }

  if (!text) return { ok: false, message: "La question est vide." };
  if (text.length > 500) return { ok: false, message: "Question trop longue (500 caractères max)." };
  if (answers.length < 2) return { ok: false, message: "Ajoute au moins deux réponses." };
  if (answers.some((a) => a.text.length > 300)) return { ok: false, message: "Réponse trop longue (300 caractères max)." };
  if (!answers.some((a) => a.isCorrect)) return { ok: false, message: "Coche au moins une bonne réponse." };

  const answerRows = answers.map((a, position) => ({ ...a, position }));
  if (id) {
    await prisma.$transaction([
      prisma.quizAnswer.deleteMany({ where: { questionId: id } }),
      prisma.quizQuestion.update({ where: { id }, data: { text, answers: { create: answerRows } } }),
    ]);
  } else {
    const last = await prisma.quizQuestion.findFirst({ where: { quizId }, orderBy: { position: "desc" } });
    await prisma.quizQuestion.create({
      data: { quizId, text, position: (last?.position ?? -1) + 1, answers: { create: answerRows } },
    });
  }

  revalidateQuiz(quizId);
  return { ok: true, message: id ? "Question mise à jour." : "Question ajoutée." };
}

export async function deleteQuestion(id: string): Promise<FormState> {
  await requireAdmin();
  const q = await prisma.quizQuestion.delete({ where: { id } });
  revalidateQuiz(q.quizId);
  return { ok: true };
}

/** Échange la question avec sa voisine (« up » ou « down »). */
export async function moveQuestion(id: string, direction: "up" | "down"): Promise<FormState> {
  await requireAdmin();
  const q = await prisma.quizQuestion.findUnique({ where: { id } });
  if (!q) return { ok: false };
  const neighbour = await prisma.quizQuestion.findFirst({
    where: {
      quizId: q.quizId,
      position: direction === "up" ? { lt: q.position } : { gt: q.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return { ok: true };
  await prisma.$transaction([
    prisma.quizQuestion.update({ where: { id: q.id }, data: { position: neighbour.position } }),
    prisma.quizQuestion.update({ where: { id: neighbour.id }, data: { position: q.position } }),
  ]);
  revalidateQuiz(q.quizId);
  return { ok: true };
}

export async function moveQuestionUp(id: string) {
  return moveQuestion(id, "up");
}

export async function moveQuestionDown(id: string) {
  return moveQuestion(id, "down");
}

/* ---------- Participations ---------- */

/** Retire une participation du classement (pseudo inapproprié…). L'IP peut alors rejouer. */
export async function deleteSubmission(id: string): Promise<FormState> {
  await requireAdmin();
  const s = await prisma.quizSubmission.delete({ where: { id } });
  revalidateQuiz(s.quizId);
  return { ok: true };
}
