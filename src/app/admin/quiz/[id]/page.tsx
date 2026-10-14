import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/format";
import type { QuizResult } from "@/lib/quiz";
import { Disclosure } from "@/components/disclosure";
import { ActionButton } from "@/components/action-button";
import { deleteQuestion, deleteQuiz, deleteSubmission, moveQuestionDown, moveQuestionUp } from "../actions";
import { QuizForm } from "../quiz-form";
import { QuestionForm } from "../question-form";

export const metadata: Metadata = { title: "Quiz — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { position: "asc" }, include: { answers: { orderBy: { position: "asc" } } } },
      submissions: { orderBy: [{ score: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!quiz) notFound();

  const subs = quiz.submissions;
  const average = subs.length ? subs.reduce((sum, s) => sum + s.score, 0) / subs.length : 0;
  // Taux de réussite par question, calculé sur les participations enregistrées.
  const successRate = (questionId: string) => {
    const answered = subs.flatMap((s) => (s.results as QuizResult[]).filter((r) => r.questionId === questionId));
    return answered.length ? Math.round((answered.filter((r) => r.correct).length / answered.length) * 100) : null;
  };

  return (
    <>
      <div className="app-header">
        <h1>{quiz.title}</h1>
        <Link className="link-btn" href="/admin/quiz">
          ← Tous les quiz
        </Link>
      </div>

      <div className="stat-grid">
        <div className="card">
          <p className="card__label">Statut</p>
          <p className="card__value">{quiz.published ? "Publié" : "Brouillon"}</p>
        </div>
        <div className="card">
          <p className="card__label">Questions</p>
          <p className="card__value">{quiz.questions.length}</p>
        </div>
        <div className="card">
          <p className="card__label">Participants</p>
          <p className="card__value">{subs.length}</p>
        </div>
        <div className="card">
          <p className="card__label">Score moyen</p>
          <p className="card__value">
            {subs.length ? average.toFixed(1).replace(".", ",") : "–"}
          </p>
        </div>
      </div>

      <section className="card" style={{ marginTop: "var(--space-l)" }}>
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Réglages
        </h2>
        <Disclosure label="Modifier le titre, la description ou la publication">
          <QuizForm quiz={quiz} />
        </Disclosure>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Questions</h2>
        {subs.length > 0 && (
          <p className="field__hint" style={{ marginTop: ".5rem" }}>
            {subs.length} participation{subs.length > 1 ? "s" : ""} déjà enregistrée
            {subs.length > 1 ? "s" : ""} : modifier les questions ne recalcule pas les scores existants.
          </p>
        )}

        <ol className="quiz-admin-list">
          {quiz.questions.map((q, i) => {
            const rate = successRate(q.id);
            return (
              <li key={q.id} className="card">
                <div className="quiz-admin-list__head">
                  <p>
                    <strong>
                      {i + 1}. {q.text}
                    </strong>
                  </p>
                  {rate !== null && <span className="badge badge--muted">{rate} % de réussite</span>}
                </div>
                <ul className="quiz-admin-list__answers">
                  {q.answers.map((a) => (
                    <li key={a.id} data-correct={a.isCorrect}>
                      {a.isCorrect ? "✓" : "·"} {a.text}
                    </li>
                  ))}
                </ul>
                <div className="inline-actions" style={{ flexWrap: "wrap" }}>
                  <Disclosure label="Modifier">
                    <QuestionForm
                      quizId={quiz.id}
                      question={{
                        id: q.id,
                        text: q.text,
                        answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
                      }}
                    />
                  </Disclosure>
                  {i > 0 && (
                    <ActionButton action={moveQuestionUp} id={q.id} className="link-btn">
                      ↑ Monter
                    </ActionButton>
                  )}
                  {i < quiz.questions.length - 1 && (
                    <ActionButton action={moveQuestionDown} id={q.id} className="link-btn">
                      ↓ Descendre
                    </ActionButton>
                  )}
                  <ActionButton
                    action={deleteQuestion}
                    id={q.id}
                    className="link-btn link-btn--danger"
                    confirm="Supprimer cette question ?"
                  >
                    Supprimer
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="card" style={{ marginTop: "var(--space-m)" }}>
          <h3 className="h-m" style={{ marginBottom: "1rem" }}>
            Nouvelle question
          </h3>
          <QuestionForm quizId={quiz.id} />
        </div>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Classement</h2>
        <p className="field__hint" style={{ marginTop: ".5rem" }}>
          Supprimer une participation la retire du classement (pseudo inapproprié…) et permet à
          cette connexion de rejouer.
        </p>
        <div className="table-scroll" style={{ marginTop: "var(--space-s)" }}>
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Pseudo</th>
                <th>Score</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>
                    {s.score} / {s.total}
                  </td>
                  <td>
                    {formatDate(s.createdAt)} {formatTime(s.createdAt)}
                  </td>
                  <td>
                    <ActionButton
                      action={deleteSubmission}
                      id={s.id}
                      className="link-btn link-btn--danger"
                      confirm={`Retirer « ${s.name} » du classement ?`}
                    >
                      Retirer
                    </ActionButton>
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucune participation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Zone sensible
        </h2>
        <ActionButton
          action={deleteQuiz}
          id={quiz.id}
          className="link-btn link-btn--danger"
          confirm={`Supprimer définitivement « ${quiz.title} », ses questions et son classement ?`}
        >
          Supprimer ce quiz
        </ActionButton>
      </section>
    </>
  );
}
