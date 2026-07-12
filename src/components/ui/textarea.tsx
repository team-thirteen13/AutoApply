"use client";

import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <textarea
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

Textarea.displayName = "Textarea";
