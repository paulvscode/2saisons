"use client";

import { useActionState } from "react";
import type { Event } from "@prisma/client";
import { saveEvent, type AdminState } from "../actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

function toDatetimeLocal(d: Date | null | undefined) {
  if (!d) return "";
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
}

export function EventForm({ event, onDone }: { event?: Event; onDone?: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(async (prev, fd) => {
    const res = await saveEvent(prev, fd);
    if (res.ok) onDone?.();
    return res;
  }, {});
  const err = state.errors ?? {};

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <FormAlert state={state} />
      {event && <input type="hidden" name="id" value={event.id} />}
      <Field label="Titre" name="title" required defaultValue={event?.title} error={err.title} />
      <Field
        label="Slug (URL)"
        name="slug"
        required
        defaultValue={event?.slug}
        hint="minuscules, chiffres et tirets"
        error={err.slug}
      />
      <Field
        label="Date & heure"
        name="date"
        type="datetime-local"
        required
        defaultValue={toDatetimeLocal(event?.date)}
        error={err.date}
      />
      <Field label="Lieu" name="location" required defaultValue={event?.location} error={err.location} />
      <Field
        label="Description"
        name="description"
        textarea
        required
        defaultValue={event?.description}
        error={err.description}
      />
      <Field
        label="Image (URL)"
        name="imageUrl"
        defaultValue={event?.imageUrl ?? ""}
        placeholder="https://…"
        error={err.imageUrl}
      />
      <Field
        label="Capacité"
        name="capacity"
        type="number"
        min={1}
        defaultValue={event?.capacity ?? undefined}
        error={err.capacity}
      />
      <label className="form__consent">
        <input type="checkbox" name="published" defaultChecked={event ? event.published : true} />
        <span>Visible sur le site public</span>
      </label>
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        {event ? "Mettre à jour" : "Créer l'événement"}
      </SubmitButton>
    </form>
  );
}
