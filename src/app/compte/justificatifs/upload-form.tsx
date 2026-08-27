"use client";

import { useActionState } from "react";
import { uploadDocument, type ActionState } from "../actions";
import { SubmitButton, FormAlert } from "@/components/ui";

export function UploadForm() {
  const [state, action] = useActionState<ActionState, FormData>(uploadDocument, {});

  return (
    <form className="card" action={action} style={{ display: "grid", gap: "var(--space-s)" }}>
      <FormAlert state={state} />
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="type">Type de justificatif *</label>
        <select id="type" name="type" required defaultValue="medical_certificate">
          <option value="medical_certificate">Certificat médical</option>
          <option value="insurance">Attestation d'assurance</option>
        </select>
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="file">Fichier *</label>
        <input id="file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required />
        <p className="field__hint">PDF, JPEG ou PNG — 6 Mo maximum.</p>
      </div>
      <SubmitButton pendingLabel="Envoi…" className="btn btn--sm">
        Téléverser
      </SubmitButton>
    </form>
  );
}
