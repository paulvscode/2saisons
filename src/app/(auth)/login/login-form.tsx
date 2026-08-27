"use client";

import { useActionState } from "react";
import { login, type AuthState } from "../actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(login, {});
  const err = state.errors ?? {};

  return (
    <form className="form" action={action} noValidate style={{ marginTop: 0 }}>
      <FormAlert state={state.message ? { ok: false, message: state.message } : null} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="E-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={err.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        error={err.password}
      />
      <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}
