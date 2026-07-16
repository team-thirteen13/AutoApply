"use client";

import { useId, type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FormField provides label-input association and error/hint descriptions.
 *
 * Children must be a single form element (Input, Select, Textarea).
 * The label's htmlFor is connected to the input via the id prop.
 * The input receives aria-describedby for hint/error text.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = htmlFor ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
