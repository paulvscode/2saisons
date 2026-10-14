import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Disclosure } from "@/components/disclosure";
import { ActionButton } from "@/components/action-button";
import { publishQuiz, unpublishQuiz } from "./actions";
import { QuizForm } from "./quiz-form";

export const metadata: Metadata = { title: "Quiz — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminQuizListPage() {
  const [quizzes, stats] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true, submissions: true } } },
    }),
    prisma.quizSubmission.groupBy({
      by: ["quizId"],
      _avg: { score: true, total: true },
      _max: { createdAt: true },
    }),
  ]);
  const statsOf = (id: string) => stats.find((s) => s.quizId === id);

  return (
    <>
      <div className="app-header">
        <h1>Quiz</h1>
      </div>

      <section className="card">
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Nouveau quiz
        </h2>
        <Disclosure label="+ Créer un quiz" openLabel="Annuler" className="btn btn--sm">
          <QuizForm />
        </Disclosure>
      </section>

      <div className="table-scroll" style={{ marginTop: "var(--space-l)" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Questions</th>
              <th>Participants</th>
              <th>Score moyen</th>
              <th>Dernière participation</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td>
                  <Link href={`/admin/quiz/${q.id}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
                    {q.title}
                  </Link>
                  <br />
                  <span className="field__hint">Créé le {formatDate(q.createdAt)}</span>
                </td>
                <td>{q._count.questions}</td>
                <td>{q._count.submissions}</td>
                <td>
                  {statsOf(q.id)?._avg.score != null
                    ? `${statsOf(q.id)!._avg.score!.toFixed(1).replace(".", ",")} / ${Math.round(statsOf(q.id)!._avg.total ?? q._count.questions)}`
                    : "–"}
                </td>
                <td>{statsOf(q.id)?._max.createdAt ? formatDate(statsOf(q.id)!._max.createdAt!) : "–"}</td>
                <td>
                  {q.published ? (
                    <span className="badge">Publié</span>
                  ) : q._count.submissions > 0 ? (
                    <span className="badge badge--muted">Archivé</span>
                  ) : (
                    <span className="badge badge--muted">Brouillon</span>
                  )}
                </td>
                <td>
                  {q.published ? (
                    <ActionButton action={unpublishQuiz} id={q.id} className="link-btn">
                      Retirer de /quiz
                    </ActionButton>
                  ) : q._count.questions > 0 ? (
                    <ActionButton action={publishQuiz} id={q.id} className="link-btn">
                      Publier
                    </ActionButton>
                  ) : (
                    <span className="field__hint">Aucune question</span>
                  )}
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Aucun quiz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
