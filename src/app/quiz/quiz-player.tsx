"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startQuiz, submitQuiz } from "./actions";

export type PlayerQuestion = {
  id: string;
  text: string;
  imageUrl: string | null;
  /** Plusieurs bonnes réponses : cases à cocher au lieu de boutons radio. */
  multiple: boolean;
  answers: { id: string; text: string }[];
};

export function QuizPlayer({
  quizId,
  questions,
  timePerQuestion,
}: {
  quizId: string;
  questions: PlayerQuestion[];
  /** Secondes par question ; null = pas de minuterie. */
  timePerQuestion: number | null;
}) {
  const router = useRouter();
  const timed = Boolean(timePerQuestion);
  const [started, setStarted] = useState(!timed);
  const [startToken, setStartToken] = useState<string>();
  const [step, setStep] = useState(0); // questions.length = étape du pseudo
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = questions.length;
  const onNameStep = step === total;
  const question = questions[step];
  const selected = question ? answers[question.id] ?? [] : [];

  // Minuterie : échéance de la question en cours ; à zéro, question suivante.
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(timePerQuestion ?? 0);
  useEffect(() => {
    if (!timed || !started || onNameStep) return;
    setDeadline(Date.now() + timePerQuestion! * 1000);
  }, [timed, started, step, onNameStep, timePerQuestion]);
  useEffect(() => {
    if (!deadline || onNameStep) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setDeadline(null);
        setStep((s) => Math.min(s + 1, total));
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, onNameStep, total]);

  function begin() {
    start(async () => {
      setStartToken(await startQuiz(quizId));
      setStarted(true);
    });
  }

  function toggle(answerId: string) {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      const next = question.multiple
        ? current.includes(answerId)
          ? current.filter((id) => id !== answerId)
          : [...current, answerId]
        : [answerId];
      return { ...prev, [question.id]: next };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await submitQuiz({ quizId, name, answers, startToken });
      if (res.ok) {
        router.refresh(); // la page affiche alors le résultat et le classement
      } else {
        setError(res.message);
        if (!res.field) router.refresh();
      }
    });
  }

  if (!started) {
    return (
      <div className="quiz card">
        <div className="quiz__question quiz__intro">
          <p className="quiz__text">Prêt·e ?</p>
          <p className="muted">
            {total} question{total > 1 ? "s" : ""}, {timePerQuestion} secondes par question. À zéro, on
            passe à la suivante : une question sans réponse compte comme fausse.
          </p>
          <div>
            <button type="button" className="btn btn--sm" onClick={begin} disabled={pending} aria-busy={pending}>
              {pending ? "Chargement…" : "Commencer"} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz card">
      <div className="quiz__progress" aria-hidden="true">
        <span style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
      </div>

      {!onNameStep && question ? (
        <fieldset className="quiz__question" key={question.id}>
          <legend>
            <span className="quiz__meta">
              <span className="card__label">
                Question {step + 1} / {total}
              </span>
              {timed && (
                <span
                  className="quiz__timer"
                  data-urgent={remaining <= 5}
                  role="timer"
                  aria-live={remaining <= 5 ? "assertive" : "off"}
                >
                  {remaining} s
                </span>
              )}
            </span>
            {timed && (
              <span className="quiz__timebar" aria-hidden="true">
                <span style={{ width: `${(remaining / timePerQuestion!) * 100}%` }} />
              </span>
            )}
            <span className="quiz__text">{question.text}</span>
            {question.multiple && <span className="field__hint">Plusieurs réponses possibles.</span>}
          </legend>
          {question.imageUrl && <img className="quiz__img" src={question.imageUrl} alt="" />}
          <div className="quiz__answers">
            {question.answers.map((a) => (
              <label key={a.id} className="quiz__answer" data-checked={selected.includes(a.id)}>
                <input
                  type={question.multiple ? "checkbox" : "radio"}
                  name={question.id}
                  checked={selected.includes(a.id)}
                  onChange={() => toggle(a.id)}
                />
                <span>{a.text}</span>
              </label>
            ))}
          </div>
          <div className="quiz__nav">
            {step > 0 && !timed ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStep(step - 1)}>
                ← Précédent
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn btn--sm"
              disabled={selected.length === 0}
              onClick={() => setStep(step + 1)}
            >
              {step + 1 === total ? "Terminer" : "Suivant"} →
            </button>
          </div>
        </fieldset>
      ) : (
        <form className="form quiz__question" onSubmit={submit} style={{ marginTop: 0 }}>
          <p className="quiz__text">Dernière étape : ton pseudo pour le classement.</p>
          <div className={`field ${error ? "field--error" : ""}`}>
            <label htmlFor="quiz-name">Pseudo *</label>
            <input
              id="quiz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              required
              autoComplete="nickname"
            />
            {error ? (
              <p className="field__error" role="alert">
                {error}
              </p>
            ) : (
              <p className="field__hint">
                Affiché publiquement. Pas d'insulte ni de propos haineux. Une seule participation par
                connexion.
              </p>
            )}
          </div>
          <div className="quiz__nav">
            {timed ? (
              <span />
            ) : (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStep(total - 1)}>
                ← Revoir mes réponses
              </button>
            )}
            <button type="submit" className="btn btn--sm" disabled={pending} aria-busy={pending}>
              {pending ? "Envoi…" : "Valider mes réponses"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
