"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "../actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

export function ProfileForm({
  firstname,
  lastname,
  phone,
}: {
  firstname: string;
  lastname: string;
  phone: string | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});
  const err = state.errors ?? {};

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <FormAlert state={state} />
      <Field label="Prénom" name="firstname" required defaultValue={firstname} error={err.firstname} />
      <Field label="Nom" name="lastname" required defaultValue={lastname} error={err.lastname} />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        defaultValue={phone ?? ""}
        autoComplete="tel"
        error={err.phone}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
