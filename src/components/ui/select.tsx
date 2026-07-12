"use client";

import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = "Select";
