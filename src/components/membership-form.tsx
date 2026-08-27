"use client";

import { useActionState, useState } from "react";
import { submitMembership, type MembershipState } from "@/app/adhesion/actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

const initial: MembershipState = {};

export function MembershipForm({
  authenticated,
  stripeEnabled,
  defaultEmail,
  defaultFirstname,
  defaultLastname,
}: {
  authenticated: boolean;
  stripeEnabled: boolean;
  defaultEmail?: string;
  defaultFirstname?: string;
  defaultLastname?: string;
}) {
  const [state, formAction] = useActionState(submitMembership, initial);
  const [kind, setKind] = useState<"adhesion" | "don" | "benevolat">("adhesion");
  const err = state.errors ?? {};

  return (
    <form className="form" action={formAction} noValidate>
      <FormAlert state={state} />

      <div className="field">
        <span id="kind-label">Je souhaite</span>
        <div className="choice-row" role="radiogroup" aria-labelledby="kind-label">
          {(
            [
              ["adhesion", "Adhérer"],
              ["don", "Faire un don"],
              ["benevolat", "Être bénévole"],
            ] as const
          ).map(([value, label]) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <Field
        label="Prénom"
        name="firstname"
        required
        autoComplete="given-name"
        placeholder="Alex"
        defaultValue={defaultFirstname}
        error={err.firstname}
      />
      <Field
        label="Nom"
        name="lastname"
        required
        autoComplete="family-name"
        placeholder="Martin"
        defaultValue={defaultLastname}
        error={err.lastname}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="alex.martin@email.fr"
        defaultValue={defaultEmail}
        error={err.email}
      />

      {!authenticated && (
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="Crée ton espace membre — 8 caractères minimum."
          error={err.password}
        />
      )}

      <Field
        key={kind}
        label={kind === "don" ? "Montant du don (€)" : "Montant (€)"}
        name="amountEuros"
        type="number"
        min={kind === "don" ? 1 : 0}
        step={5}
        defaultValue={kind === "don" ? 30 : 20}
        inputMode="numeric"
        error={err.amountEuros}
      />

      <Field
        label="Message (facultatif)"
        name="message"
        textarea
        placeholder="Ton niveau, tes dispos, une question…"
        error={err.message}
      />

      <label className="form__consent">
        <input type="checkbox" name="consent" value="on" required />
        <span>
          J'accepte que mes informations soient utilisées pour traiter ma demande, conformément à
          la politique de confidentialité.
        </span>
      </label>

      <SubmitButton pendingLabel="Redirection…">
        {stripeEnabled ? "Continuer vers le paiement" : "Valider mon adhésion"}{" "}
        <span aria-hidden="true">→</span>
      </SubmitButton>

      {!stripeEnabled && (
        <p className="field__hint" style={{ marginTop: ".75rem" }}>
          Paiement en ligne non activé (environnement de démonstration) : l'adhésion est enregistrée
          immédiatement.
        </p>
      )}
    </form>
  );
}
