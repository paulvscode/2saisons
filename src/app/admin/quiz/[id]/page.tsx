import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/format";
import { readResults, type QuizResult } from "@/lib/quiz";
import { Disclosure } from "@/components/disclosure";
import { ActionButton } from "@/components/action-button";
import {
  deleteQuestion,
  deleteQuiz,
  deleteSubmission,
  moveQuestionDown,
  moveQuestionUp,
  publishQuiz,
  unpublishQuiz,
} from "../actions";
import { QuizForm } from "../quiz-form";
import { QuestionForm } from "../question-form";

export const metadata: Metadata = { title: "Quiz — Admin" };
export const dynamic = "force-dynamic";

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

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

  const subs = quiz.submissions.map((s) => ({ ...s, answers: readResults(s.results) }));
  const average = subs.length ? subs.reduce((sum, s) => sum + s.score, 0) / subs.length : 0;

  /** Réponses enregistrées pour une question (toutes participations confondues). */
  const answersFor = (questionId: string) =>
    subs.flatMap((s) => s.answers.filter((r) => r.questionId === questionId));
  const rateOf = (answered: QuizResult[]) =>
    answered.length ? pct(answered.filter((r) => r.correct).length, answered.length) : null;

  // Questions supprimées depuis, mais présentes dans l'historique des participations.
  const currentIds = new Set(quiz.questions.map((q) => q.id));
  const removed = new Map<string, string>();
  for (const s of subs) {
    for (const r of s.answers) {
      if (!currentIds.has(r.questionId) && !removed.has(r.questionId)) {
        removed.set(r.questionId, r.question ?? "Question supprimée");
      }
    }
  }

  return (
    <>
      <div className="app-header">
        <h1>{quiz.title}</h1>
        <Link className="link-btn" href="/admin/quiz">
          ← Tous les quiz
        </Link>
      </div>

      <div className="quiz-publish card">
        <p>
          {quiz.published ? (
            <>
              <strong>En ligne sur /quiz.</strong> Les visiteurs peuvent y répondre.{" "}
              <Link href="/quiz" target="_blank" style={{ textDecoration: "underline" }}>
                Voir ↗
              </Link>
            </>
          ) : quiz.questions.length === 0 ? (
            <>
              <strong>Pas encore publiable :</strong> ajoute au moins une question.
            </>
          ) : (
            <>
              <strong>Non publié.</strong> Publier ce quiz retire de /quiz celui qui y est
              actuellement.
            </>
          )}
        </p>
        {quiz.published ? (
          <ActionButton
            action={unpublishQuiz}
            id={quiz.id}
            className="btn btn--sm btn--ghost"
            confirm="Retirer ce quiz de /quiz ? Le classement et les participations sont conservés."
          >
            Retirer de /quiz
          </ActionButton>
        ) : (
          quiz.questions.length > 0 && (
            <ActionButton action={publishQuiz} id={quiz.id} className="btn btn--sm">
              Publier sur /quiz
            </ActionButton>
          )
        )}
      </div>

      <div className="stat-grid">
        <div className="card">
          <p className="card__label">Statut</p>
          <p className="card__value card__value--text">
            {quiz.published ? "Publié" : subs.length > 0 ? "Archivé" : "Brouillon"}
          </p>
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
          <p className="card__label">Minuterie</p>
          <p className={`card__value ${quiz.timePerQuestion ? "" : "card__value--text"}`}>
            {quiz.timePerQuestion ? `${quiz.timePerQuestion} s` : "Aucune"}
          </p>
        </div>
        <div className="card">
          <p className="card__label">Score moyen</p>
          <p className="card__value">{subs.length ? average.toFixed(1).replace(".", ",") : "–"}</p>
        </div>
      </div>

      <section className="card" style={{ marginTop: "var(--space-l)" }}>
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Réglages
        </h2>
        <Disclosure label="Modifier le titre, la description, l'image ou la minuterie">
          <QuizForm quiz={quiz} />
        </Disclosure>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m">Questions et réponses</h2>
        {subs.length > 0 && (
          <p className="field__hint" style={{ marginTop: ".5rem" }}>
            Pour chaque réponse : nombre de participants qui l'ont choisie. Modifier une question ne
            recalcule pas les scores existants.
          </p>
        )}

        <ol className="quiz-admin-list">
          {quiz.questions.map((q, i) => {
            const answered = answersFor(q.id);
            const rate = rateOf(answered);
            // Répartition calculée sur les participations qui ont enregistré le détail des choix.
            const detailed = answered.filter((r) => r.chosen);
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
                {q.imageUrl && <img className="quiz-admin-list__img" src={q.imageUrl} alt="" loading="lazy" />}
                <ul className="quiz-admin-list__answers">
                  {q.answers.map((a) => {
                    const count = detailed.filter((r) => r.chosen!.some((c) => c.id === a.id)).length;
                    return (
                      <li key={a.id} data-correct={a.isCorrect}>
                        <span>
                          {a.isCorrect ? "✓" : "·"} {a.text}
                        </span>
                        {detailed.length > 0 && (
                          <span className="answer-bar" aria-label={`${count} sur ${detailed.length}`}>
                            <span className="answer-bar__track">
                              <span className="answer-bar__fill" style={{ width: `${pct(count, detailed.length)}%` }} />
                            </span>
                            <span className="answer-bar__label">
                              {count} · {pct(count, detailed.length)} %
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="inline-actions" style={{ flexWrap: "wrap" }}>
                  <Disclosure label="Modifier">
                    <QuestionForm
                      quizId={quiz.id}
                      question={{
                        id: q.id,
                        text: q.text,
                        imageUrl: q.imageUrl,
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
                    confirm="Supprimer cette question ? Les réponses déjà données restent dans l'historique."
                  >
                    Supprimer
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ol>

        {removed.size > 0 && (
          <>
            <h3 className="h-m" style={{ marginTop: "var(--space-l)" }}>
              Questions supprimées (historique)
            </h3>
            <ul className="quiz-admin-list">
              {[...removed].map(([qid, text]) => (
                <li key={qid} className="card">
                  <div className="quiz-admin-list__head">
                    <p className="muted">{text}</p>
                    <span className="badge badge--muted">{rateOf(answersFor(qid))} % de réussite</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="card" style={{ marginTop: "var(--space-m)" }}>
          <h3 className="h-m" style={{ marginBottom: "1rem" }}>
            Nouvelle question
          </h3>
          <QuestionForm quizId={quiz.id} />
        </div>
      </section>

      <section style={{ marginTop: "var(--space-xl)" }}>
        <div className="quiz-admin-list__head">
          <h2 className="h-m">Participants ({subs.length})</h2>
          {subs.length > 0 && (
            <a className="btn btn--sm btn--ghost" href={`/api/admin/quiz/${quiz.id}/export`}>
              Exporter en CSV
            </a>
          )}
        </div>
        <p className="field__hint" style={{ marginTop: ".5rem" }}>
          Clique sur un participant pour voir ses réponses. Le retirer l'enlève du classement
          (pseudo inapproprié…) et permet à sa connexion de rejouer.
        </p>

        {subs.length === 0 ? (
          <p className="muted" style={{ marginTop: "var(--space-s)" }}>
            Aucune participation.
          </p>
        ) : (
          <ol className="participants">
            {subs.map((s, i) => (
              <li key={s.id}>
                <details className="participant">
                  <summary>
                    <span className="participant__rank">{i + 1}</span>
                    <span className="participant__name">{s.name}</span>
                    <span className="participant__score">
                      {s.score} / {s.total}
                    </span>
                    <span className="participant__date">
                      {formatDate(s.createdAt)} {formatTime(s.createdAt)}
                    </span>
                  </summary>
                  <details className="participant__ip">
                    <summary>Adresse IP</summary>
                    {s.ip ? (
                      <code>{s.ip}</code>
                    ) : (
                      <span className="muted">Non enregistrée (participation antérieure à cette fonction).</span>
                    )}
                  </details>
                  <ol className="participant__answers">
                    {s.answers.map((r, j) => (
                      <li key={r.questionId} data-correct={r.correct}>
                        <p>
                          <span aria-label={r.correct ? "Juste" : "Faux"}>{r.correct ? "✓" : "✗"}</span>{" "}
                          <strong>
                            {j + 1}.{" "}
                            {r.question ??
                              quiz.questions.find((q) => q.id === r.questionId)?.text ??
                              "Question supprimée"}
                          </strong>
                        </p>
                        {r.chosen ? (
                          <p>
                            Réponse : {r.chosen.map((c) => c.text).join(", ") || "—"}
                            {!r.correct && r.expected && (
                              <span className="muted">
                                {" "}
                                · Bonne réponse : {r.expected.map((c) => c.text).join(", ")}
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="muted">Détail des réponses non enregistré pour cette participation.</p>
                        )}
                      </li>
                    ))}
                  </ol>
                  <ActionButton
                    action={deleteSubmission}
                    id={s.id}
                    className="link-btn link-btn--danger"
                    confirm={`Retirer « ${s.name} » du classement ?`}
                  >
                    Retirer du classement
                  </ActionButton>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card" style={{ marginTop: "var(--space-xl)" }}>
        <h2 className="h-m" style={{ marginBottom: "1rem" }}>
          Zone sensible
        </h2>
        <ActionButton
          action={deleteQuiz}
          id={quiz.id}
          className="link-btn link-btn--danger"
          confirm={`Supprimer définitivement « ${quiz.title} », ses questions et toutes les participations ?`}
        >
          Supprimer ce quiz
        </ActionButton>
      </section>
    </>
  );
}
