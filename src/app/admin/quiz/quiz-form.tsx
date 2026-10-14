"use client";

import { useActionState } from "react";
import type { Quiz } from "@prisma/client";
import type { FormState } from "@/lib/action-types";
import { Field, FormAlert, SubmitButton } from "@/components/ui";
import { saveQuiz } from "./actions";

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
      <label className="form__consent">
        <input type="checkbox" name="published" defaultChecked={quiz?.published ?? false} />
        <span>Publié sur /quiz (un seul quiz publié à la fois : publier celui-ci retire les autres)</span>
      </label>
      <FormAlert state={state} />
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        {quiz ? "Enregistrer" : "Créer le quiz"}
      </SubmitButton>
    </form>
  );
}
