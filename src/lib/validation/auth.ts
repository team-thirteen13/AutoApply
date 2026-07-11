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
