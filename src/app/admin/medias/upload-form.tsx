"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/action-types";
import { FormAlert, SubmitButton } from "@/components/ui";
import { uploadMedia } from "../contenu/actions";

export function UploadForm({ accept }: { accept: string }) {
  const [state, action] = useActionState<FormState, FormData>(uploadMedia, {});

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <div className="field">
        <label htmlFor="media-files">Images</label>
        <input id="media-files" type="file" name="files" accept={accept} multiple required />
        <p className="field__hint">JPEG, PNG, WebP, GIF ou AVIF — 8 Mo maximum par image.</p>
      </div>
      <FormAlert state={state} />
      <SubmitButton pendingLabel="Téléversement…" className="btn btn--sm">
        Téléverser
      </SubmitButton>
    </form>
  );
}
