"use client";

import { useActionState } from "react";
import type { Spot } from "@prisma/client";
import { saveSpot, type AdminState } from "../actions";
import { Field, SubmitButton, FormAlert } from "@/components/ui";

export function SpotForm({ spot }: { spot?: Spot }) {
  const [state, action] = useActionState<AdminState, FormData>(saveSpot, {});
  const err = state.errors ?? {};

  return (
    <form className="form" action={action} style={{ marginTop: 0 }}>
      <FormAlert state={state} />
      {spot && <input type="hidden" name="id" value={spot.id} />}
      <Field label="Nom" name="name" required defaultValue={spot?.name} error={err.name} />
      <Field label="Adresse" name="address" required defaultValue={spot?.address} error={err.address} />
      <div className="field">
        <label htmlFor="spot-type">Type *</label>
        <select id="spot-type" name="type" required defaultValue={spot?.type ?? "street"}>
          <option value="street">Street</option>
          <option value="park">Skatepark</option>
          <option value="bowl">Bowl / DIY</option>
        </select>
      </div>
      <Field
        label="Description"
        name="description"
        textarea
        required
        defaultValue={spot?.description}
        error={err.description}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-s)" }}>
        <Field
          label="Latitude"
          name="latitude"
          type="number"
          step={0.0001}
          defaultValue={spot?.latitude ?? undefined}
          error={err.latitude}
        />
        <Field
          label="Longitude"
          name="longitude"
          type="number"
          step={0.0001}
          defaultValue={spot?.longitude ?? undefined}
          error={err.longitude}
        />
      </div>
      <SubmitButton pendingLabel="Enregistrement…" className="btn btn--sm">
        {spot ? "Mettre à jour" : "Créer le spot"}
      </SubmitButton>
    </form>
  );
}
