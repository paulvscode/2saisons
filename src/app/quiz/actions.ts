"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validatePlayerName } from "@/lib/moderation";
import {
  allowedDurationMs,
  elapsedSinceStart,
  getClientIp,
  getRank,
  hashIp,
  signQuizStart,
  type QuizResult,
} from "@/lib/quiz";

export type SubmitQuizResult =
  | { ok: true; score: number; total: number; rank: number }
  | { ok: false; message: string; field?: "name" };

/** Démarre un quiz minuté : renvoie le jeton signé à renvoyer avec les réponses. */
export async function startQuiz(quizId: string): Promise<string> {
  return signQuizStart(quizId);
}

/**
 * Corrige le quiz côté serveur (les bonnes réponses ne sont jamais envoyées au navigateur)
 * et l'inscrit au classement. Une seule participation par IP et par quiz.
 */
export async function submitQuiz(input: {
  quizId: string;
  name: string;
  answers: Record<string, string[]>;
  /** Jeton de startQuiz, obligatoire si le quiz est minuté. */
  startToken?: string;
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

  const ip = await getClientIp();
  const ipHash = hashIp(ip);
  const already = await prisma.quizSubmission.findUnique({
    where: { quizId_ipHash: { quizId: quiz.id, ipHash } },
  });
  if (already) return { ok: false, message: "Tu as déjà participé à ce quiz." };

  // Une question est juste si la sélection correspond exactement aux bonnes réponses.
  // Le texte de la question et des réponses est conservé pour l'historique (admin).
  const results: QuizResult[] = quiz.questions
    .sort((a, b) => a.position - b.position)
    .map((q) => {
      const chosenIds = new Set(input.answers?.[q.id] ?? []);
      const expected = q.answers.filter((a) => a.isCorrect);
      const correct =
        chosenIds.size === expected.length && expected.every((a) => chosenIds.has(a.id));
      const pick = (a: { id: string; text: string }) => ({ id: a.id, text: a.text });
      return {
        questionId: q.id,
        correct,
        question: q.text,
        chosen: q.answers.filter((a) => chosenIds.has(a.id)).map(pick),
        expected: expected.map(pick),
      };
    });
  if (quiz.timePerQuestion) {
    // Quiz minuté : une question sans réponse (temps écoulé) compte comme fausse,
    // mais la durée totale est contrôlée ici (la minuterie du navigateur est contournable).
    const elapsed = elapsedSinceStart(quiz.id, input.startToken);
    if (elapsed === null) return { ok: false, message: "Session de quiz invalide : recharge la page." };
    if (elapsed > allowedDurationMs(quiz.timePerQuestion, quiz.questions.length)) {
      return { ok: false, message: "Temps dépassé : tes réponses n'ont pas pu être prises en compte." };
    }
  } else if (quiz.questions.some((q) => (input.answers?.[q.id] ?? []).length === 0)) {
    return { ok: false, message: "Réponds à toutes les questions avant de valider." };
  }
  const score = results.filter((r) => r.correct).length;

  let submission;
  try {
    submission = await prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        name,
        ipHash,
        ip: ip === "unknown" ? null : ip,
        score,
        total: results.length,
        results,
      },
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
