// ─────────────────────────────────────────────────────────────
// Authentication Validation Schemas
// ─────────────────────────────────────────────────────────────
// Zod schemas for sign-up and sign-in inputs.
// Validates before calling Supabase to fail fast on bad input.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// ── OAuth schemas ─────────────────────────────────────────

export const startOAuthSchema = z.object({
  nextPath: z
    .string()
    .default("/")
    .refine(
      (val) => val.startsWith("/") && !val.startsWith("//"),
      "Redirect must be an application-relative path",
    )
    .refine(
      (val) => !/[?#\\]/.test(val) && !/^[a-zA-Z]+:/.test(val),
      "Redirect must not contain a scheme, query string, fragment, or backslash",
    )
    .refine(
      (val) => !/[\x00-\x1f\x7f]/.test(val),
      "Redirect must not contain control characters",
    )
    .refine(
      (val) => val.length <= 512,
      "Redirect path too long",
    ),
});

export const exchangeCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Authorization code is required")
    .max(1024, "Authorization code too long"),
});

export type StartOAuthInput = z.infer<typeof startOAuthSchema>;
export type ExchangeCodeInput = z.infer<typeof exchangeCodeSchema>;
