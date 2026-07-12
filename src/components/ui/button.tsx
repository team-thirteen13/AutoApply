"use client";

import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-blue-500 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-100 focus:ring-blue-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  gradient:
    "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 focus:ring-blue-500 shadow-sm",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
