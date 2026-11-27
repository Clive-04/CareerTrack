import type { ReactNode } from "react";

/**
 * Persistent label, optional hint, and an error placed directly under the
 * control. The control itself should spread `fieldProps(id, error, hint)`.
 */
export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="app-field-label">
        {label}
        {required ? <span className="font-normal text-slate-500"> (required)</span> : null}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="app-field-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="app-field-error">{error}</p>}
    </div>
  );
}

export function fieldProps(id: string, error?: string, hasHint = false) {
  const describedBy = error ? `${id}-error` : hasHint ? `${id}-hint` : undefined;
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  } as const;
}

/** Focuses the first control flagged invalid inside a form after a failed submit. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  window.requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  });
}
