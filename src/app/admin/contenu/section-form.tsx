"use client";

import { useActionState } from "react";
import type { ContentSection, SiteContent } from "@/lib/content-schema";
import type { FormState } from "@/lib/action-types";
import { Field, FormAlert, SubmitButton } from "@/components/ui";
import { saveContentSection } from "./actions";
import { ImagePicker } from "./image-picker";

export function SectionForm({
  section,
  values,
  media,
  accept,
  acceptVector,
}: {
  section: ContentSection;
  values: SiteContent;
  media: string[];
  accept: string;
  acceptVector: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveContentSection, {});

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <input type="hidden" name="section" value={section.id} />
      {Object.entries(section.fields).map(([key, field]) =>
        field.type === "image" ? (
          // La clé change après enregistrement pour vider le champ fichier.
          <ImagePicker
            key={`${key}:${values[key]}`}
            name={key}
            label={field.label}
            hint={field.hint}
            defaultValue={values[key]}
            media={media}
            accept={field.vector ? acceptVector : accept}
          />
        ) : field.type === "choice" ? (
          <div key={key} className="field">
            <label htmlFor={`f-${key}`}>{field.label}</label>
            <select id={`f-${key}`} name={key} defaultValue={values[key]}>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {field.hint && <p className="field__hint">{field.hint}</p>}
          </div>
        ) : (
          <Field
            key={key}
            name={key}
            label={field.label}
            hint={field.hint}
            defaultValue={values[key]}
            textarea={field.type === "textarea"}
          />
        ),
      )}
      <FormAlert state={state} />
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
