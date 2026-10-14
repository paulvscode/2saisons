"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validatePlayerName } from "@/lib/moderation";
import { getClientIpHash, getRank, type QuizResult } from "@/lib/quiz";

export type SubmitQuizResult =
  | { ok: true; score: number; total: number; rank: number }
  | { ok: false; message: string; field?: "name" };

/**
 * Corrige le quiz côté serveur (les bonnes réponses ne sont jamais envoyées au navigateur)
 * et l'inscrit au classement. Une seule participation par IP et par quiz.
 */
export async function submitQuiz(input: {
  quizId: string;
  name: string;
  answers: Record<string, string[]>;
}): Promise<SubmitQuizResult> {
  const nameError = validatePlayerName(input.name ?? "");
  if (nameError) return { ok: false, message: nameError, field: "name" };
  const name = input.name.trim().replace(/\s+/g, " ");

  const quiz = await prisma.quiz.findFirst({
    where: { id: input.quizId, published: true },
    include: { questions: { include: { answers: true } } },
  });
  if (!quiz || quiz.questions.length === 0) {
    return { ok: false, message: "Ce quiz n'est plus disponible." };
  }

  const ipHash = await getClientIpHash();
  const already = await prisma.quizSubmission.findUnique({
    where: { quizId_ipHash: { quizId: quiz.id, ipHash } },
  });
  if (already) return { ok: false, message: "Tu as déjà participé à ce quiz." };

  // Une question est juste si la sélection correspond exactement aux bonnes réponses.
  const results: QuizResult[] = quiz.questions.map((q) => {
    const chosen = new Set(input.answers?.[q.id] ?? []);
    const expected = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
    const correct = chosen.size === expected.length && expected.every((id) => chosen.has(id));
    return { questionId: q.id, correct };
  });
  if (quiz.questions.some((q) => (input.answers?.[q.id] ?? []).length === 0)) {
    return { ok: false, message: "Réponds à toutes les questions avant de valider." };
  }
  const score = results.filter((r) => r.correct).length;

  let submission;
  try {
    submission = await prisma.quizSubmission.create({
      data: { quizId: quiz.id, name, ipHash, score, total: results.length, results },
    });
  } catch (e) {
    // Course entre deux envois depuis la même IP : la contrainte unique tranche.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Tu as déjà participé à ce quiz." };
    }
    throw e;
  }

  revalidatePath("/quiz");
  revalidatePath(`/admin/quiz/${quiz.id}`);
  return {
    ok: true,
    score,
    total: results.length,
    rank: await getRank(quiz.id, score, submission.createdAt),
  };
}
