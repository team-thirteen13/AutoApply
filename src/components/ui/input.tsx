"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
        } ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
