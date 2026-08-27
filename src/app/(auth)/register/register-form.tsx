"use client";

import { useActionState } from "react";
import { register, type AuthState } from "../actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(register, {});
  const err = state.errors ?? {};

  return (
    <form className="form" action={action} noValidate style={{ marginTop: 0 }}>
      <FormAlert state={state.message ? { ok: false, message: state.message } : null} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Prénom" name="firstname" required autoComplete="given-name" error={err.firstname} />
      <Field label="Nom" name="lastname" required autoComplete="family-name" error={err.lastname} />
      <Field label="E-mail" name="email" type="email" required autoComplete="email" error={err.email} />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="8 caractères minimum."
        error={err.password}
      />
      <SubmitButton pendingLabel="Création…">Créer mon compte</SubmitButton>
    </form>
  );
}
