"use client";

import { useFormStatus } from "react-dom";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  hint?: string;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: number;
  step?: number;
  textarea?: boolean;
};

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  hint,
  error,
  autoComplete,
  inputMode,
  min,
  step,
  textarea,
}: FieldProps) {
  const id = `f-${name}`;
  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      {textarea ? (
        <textarea id={id} name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          inputMode={inputMode}
          min={min}
          step={step}
        />
      )}
      {hint && !error ? <p className="field__hint">{hint}</p> : null}
      {error ? <p className="field__error">{error}</p> : null}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Envoi…",
  className = "btn btn--block",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormAlert({ state }: { state?: { ok?: boolean; message?: string } | null }) {
  if (!state?.message) return null;
  return (
    <p className={`alert ${state.ok ? "alert--ok" : "alert--err"}`} role="status">
      {state.message}
    </p>
  );
}
