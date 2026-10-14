"use client";

import { useEffect, useRef, useState } from "react";

/** Image facultative d'un quiz ou d'une question : aperçu, remplacement, retrait. */
export function ImageField({ id, label, current }: { id: string; label: string; current?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);

  // Le formulaire est réinitialisé après un enregistrement réussi : on vide aussi l'aperçu.
  useEffect(() => {
    const form = input.current?.form;
    const onReset = () => {
      setPreview(null);
      setRemove(false);
    };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = preview ?? (remove ? null : current);

  return (
    <div className="field image-picker">
      <label htmlFor={id}>{label}</label>
      <div className="image-picker__row">
        <div className="image-picker__thumb">
          {shown ? <img src={shown} alt="" /> : <span>Aucune image</span>}
        </div>
        <div className="image-picker__controls">
          <input
            ref={input}
            id={id}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
              if (file) setRemove(false);
            }}
          />
          {current && !preview && (
            <label className="form__consent" style={{ marginTop: 0 }}>
              <input
                type="checkbox"
                name="removeImage"
                checked={remove}
                onChange={(e) => setRemove(e.target.checked)}
              />
              <span>Retirer l'image</span>
            </label>
          )}
          <p className="field__hint">Facultative. JPEG, PNG, WebP, GIF ou AVIF, 8 Mo maximum.</p>
        </div>
      </div>
    </div>
  );
}
