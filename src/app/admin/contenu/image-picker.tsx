"use client";

import { useEffect, useState } from "react";

/**
 * Choix d'une image : depuis la médiathèque (select) ou téléversement direct (fichier).
 * Un fichier choisi prime sur la sélection à l'enregistrement.
 */
export function ImagePicker({
  name,
  label,
  hint,
  defaultValue,
  media,
  accept,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
  media: string[];
  accept: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState<string | null>(null);
  const [isIllustrator, setIsIllustrator] = useState(false);
  const options = value && !media.includes(value) ? [value, ...media] : media;
  const id = `f-${name}`;

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = preview ?? value;

  return (
    <div className="field image-picker">
      <label htmlFor={id}>{label}</label>
      <div className="image-picker__row">
        <div className="image-picker__thumb">
          {isIllustrator ? (
            <span>Fichier .ai : aperçu après enregistrement</span>
          ) : shown ? (
            <img src={shown} alt="" />
          ) : (
            <span>Aucune image</span>
          )}
        </div>
        <div className="image-picker__controls">
          <select
            id={id}
            name={name}
            value={value}
            disabled={preview !== null}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">— Aucune (placeholder) —</option>
            {options.map((url) => (
              <option key={url} value={url}>
                {url.split("/").pop()}
              </option>
            ))}
          </select>
          <input
            type="file"
            name={`${name}__file`}
            accept={accept}
            aria-label={`${label} — téléverser une nouvelle image`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setIsIllustrator(Boolean(file && /\.ai$/i.test(file.name)));
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <p className="field__hint">
            {isIllustrator
              ? "Fichier Illustrator : converti en SVG (logo) et PNG (favicon) à l'enregistrement."
              : preview
                ? "Nouvelle image : elle sera ajoutée à la médiathèque à l'enregistrement."
                : hint}
          </p>
        </div>
      </div>
    </div>
  );
}
