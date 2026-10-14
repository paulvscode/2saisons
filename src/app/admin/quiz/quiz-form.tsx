"use client";

import { useActionState } from "react";
import type { Quiz } from "@prisma/client";
import type { FormState } from "@/lib/action-types";
import { Field, FormAlert, SubmitButton } from "@/components/ui";
import { saveQuiz } from "./actions";
import { ImageField } from "./image-field";

export function QuizForm({ quiz }: { quiz?: Quiz }) {
  const [state, action] = useActionState<FormState, FormData>(saveQuiz, {});

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      {quiz && <input type="hidden" name="id" value={quiz.id} />}
      <Field label="Titre" name="title" required defaultValue={quiz?.title} error={state.errors?.title} />
      <Field
        label="Description"
        name="description"
        textarea
        defaultValue={quiz?.description ?? ""}
        hint="Facultatif. Affichée sous le titre sur /quiz."
      />
      <ImageField id={`quiz-image-${quiz?.id ?? "new"}`} label="Image du quiz" current={quiz?.imageUrl} />
      <Field
        label="Minuterie : secondes par question"
        name="timePerQuestion"
        type="number"
        min={5}
        step={1}
        defaultValue={quiz?.timePerQuestion ?? ""}
        error={state.errors?.timePerQuestion}
        hint="Vide = pas de limite. À zéro, on passe à la question suivante ; une question sans réponse compte comme fausse."
      />
      <FormAlert state={state} />
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        {quiz ? "Enregistrer" : "Créer le quiz"}
      </SubmitButton>
    </form>
  );
}
