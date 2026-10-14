"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/action-types";
import { FormAlert, SubmitButton } from "@/components/ui";
import { saveQuestion } from "./actions";
import { ImageField } from "./image-field";

type AnswerRow = { key: number; text: string; isCorrect: boolean };

let nextKey = 0;
const row = (text = "", isCorrect = false): AnswerRow => ({ key: nextKey++, text, isCorrect });

export function QuestionForm({
  quizId,
  question,
}: {
  quizId: string;
  question?: {
    id: string;
    text: string;
    imageUrl?: string | null;
    answers: { text: string; isCorrect: boolean }[];
  };
}) {
  const [rows, setRows] = useState<AnswerRow[]>(() =>
    question ? question.answers.map((a) => row(a.text, a.isCorrect)) : [row(), row()],
  );
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveQuestion(prev, fd);
    if (res.ok && !question) setRows([row(), row()]); // nouvelle question : formulaire vidé
    return res;
  }, {});

  const prefix = question?.id ?? "new";

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <input type="hidden" name="quizId" value={quizId} />
      {question && <input type="hidden" name="id" value={question.id} />}
      <div className="field">
        <label htmlFor={`q-${prefix}`}>Question *</label>
        <textarea id={`q-${prefix}`} name="text" required maxLength={500} defaultValue={question?.text} />
      </div>
      <ImageField id={`q-image-${prefix}`} label="Image de la question" current={question?.imageUrl} />

      <fieldset className="quiz-answers-edit">
        <legend>Réponses (coche la ou les bonnes réponses)</legend>
        {rows.map((r, i) => (
          <div key={r.key} className="quiz-answers-edit__row">
            <input
              type="checkbox"
              name={`answer.${i}.correct`}
              checked={r.isCorrect}
              onChange={(e) =>
                setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, isCorrect: e.target.checked } : x)))
              }
              aria-label={`Réponse ${i + 1} correcte`}
              title="Bonne réponse"
            />
            <input
              type="text"
              name={`answer.${i}.text`}
              value={r.text}
              maxLength={300}
              placeholder={`Réponse ${i + 1}`}
              onChange={(e) =>
                setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, text: e.target.value } : x)))
              }
            />
            <button
              type="button"
              className="link-btn link-btn--danger"
              disabled={rows.length <= 2}
              onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              aria-label={`Retirer la réponse ${i + 1}`}
            >
              Retirer
            </button>
          </div>
        ))}
        <button type="button" className="link-btn" onClick={() => setRows((rs) => [...rs, row()])}>
          + Ajouter une réponse
        </button>
      </fieldset>

      <FormAlert state={state} />
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        {question ? "Mettre à jour" : "Ajouter la question"}
      </SubmitButton>
    </form>
  );
}
