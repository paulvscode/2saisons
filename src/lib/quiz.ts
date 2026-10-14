import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Empreinte de l'IP du visiteur : HMAC-SHA256 avec AUTH_SECRET.
 * L'IP n'est jamais stockée en clair ; l'empreinte suffit à limiter à une participation par IP.
 * Sur Vercel, x-forwarded-for est réécrit par la plateforme (non falsifiable par le client).
 */
export async function getClientIpHash() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-secret").update(ip).digest("hex");
}

/** Quiz affiché sur /quiz (un seul publié à la fois), questions et réponses dans l'ordre. */
export function getActiveQuiz() {
  return prisma.quiz.findFirst({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { answers: { orderBy: { position: "asc" } } },
      },
    },
  });
}

/** Classement : meilleur score d'abord, puis le plus ancien à égalité. */
export function getLeaderboard(quizId: string, take = 20) {
  return prisma.quizSubmission.findMany({
    where: { quizId },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take,
    select: { id: true, name: true, score: true, total: true, createdAt: true },
  });
}

/** Rang d'une participation dans le classement (1 = premier). */
export async function getRank(quizId: string, score: number, createdAt: Date) {
  const ahead = await prisma.quizSubmission.count({
    where: {
      quizId,
      OR: [{ score: { gt: score } }, { score, createdAt: { lt: createdAt } }],
    },
  });
  return ahead + 1;
}

export async function getQuizStats(quizId: string) {
  const agg = await prisma.quizSubmission.aggregate({
    where: { quizId },
    _count: true,
    _avg: { score: true },
  });
  return { participants: agg._count, averageScore: agg._avg.score ?? 0 };
}

export type QuizResult = { questionId: string; correct: boolean };
