import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getActiveQuiz, getClientIpHash, getLeaderboard, getQuizStats, getRank } from "@/lib/quiz";
import { QuizPlayer } from "./quiz-player";
import { Leaderboard } from "./leaderboard";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Teste tes connaissances sur le skate et grimpe au classement.",
};

// Dépend de l'IP du visiteur et du classement en direct.
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const quiz = await getActiveQuiz();

  if (!quiz || quiz.questions.length === 0) {
    return (
      <section className="page-intro wrap">
        <h1>Quiz</h1>
        <p className="muted" style={{ marginTop: "var(--space-m)" }}>
          Pas de quiz en ce moment. Reviens bientôt !
        </p>
      </section>
    );
  }

  const ipHash = await getClientIpHash();
  const [mine, entries, stats] = await Promise.all([
    prisma.quizSubmission.findUnique({ where: { quizId_ipHash: { quizId: quiz.id, ipHash } } }),
    getLeaderboard(quiz.id),
    getQuizStats(quiz.id),
  ]);
  const rank = mine ? await getRank(quiz.id, mine.score, mine.createdAt) : null;

  return (
    <>
      <section className="page-intro wrap">
        <p className="eyebrow">Quiz</p>
        <h1>{quiz.title}</h1>
        {quiz.description && (
          <p className="lead" style={{ marginTop: "var(--space-m)" }}>
            {quiz.description}
          </p>
        )}
        {quiz.imageUrl && <img className="quiz__cover" src={quiz.imageUrl} alt="" />}
      </section>

      <section className="section section--tight wrap">
        {mine ? (
          <div className="card quiz__result" role="status">
            <p className="card__label">Ton résultat, {mine.name}</p>
            <p className="quiz__score">
              {mine.score} / {mine.total}
            </p>
            <p className="muted">
              {rank}
              {rank === 1 ? "er" : "e"} sur {stats.participants} participant
              {stats.participants > 1 ? "s" : ""}. Une seule participation par connexion : merci d'avoir joué !
            </p>
          </div>
        ) : (
          <QuizPlayer
            quizId={quiz.id}
            timePerQuestion={quiz.timePerQuestion}
            questions={quiz.questions.map((q) => ({
              id: q.id,
              text: q.text,
              imageUrl: q.imageUrl,
              multiple: q.answers.filter((a) => a.isCorrect).length > 1,
              // Jamais isCorrect côté navigateur : la correction se fait sur le serveur.
              answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
            }))}
          />
        )}
      </section>

      <Leaderboard
        entries={entries}
        participants={stats.participants}
        averageScore={stats.averageScore}
        total={quiz.questions.length}
        highlightId={mine?.id}
      />
    </>
  );
}
