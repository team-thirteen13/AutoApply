// ─────────────────────────────────────────────────────────────
// Email/Password Sign-Up
// ─────────────────────────────────────────────────────────────
// Validates input with Zod, calls Supabase signUp, and returns
// a structured result. Handles both email-confirmation configs:
// - user with session (autoconfirm ON)
// - user without session (autoconfirm OFF)
// Never exposes tokens or session objects.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validation/auth";
import { type AuthUser, type AuthOperationResult } from "@/types/auth";
import { mapAuthErrorCode } from "./map-auth-error";
import { toAuthUser } from "./auth-user";

export async function signUp(
  input: unknown,
): Promise<AuthOperationResult<AuthUser>> {
  // ── Validate ──────────────────────────────────────────────
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const code = field === "password" ? "invalid_password" : "invalid_email";
    return {
      success: false,
      error: { code, message: parsed.error.issues[0].message },
    };
  }

  // ── Call Supabase ─────────────────────────────────────────
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: { code: mapAuthErrorCode(error), message: error.message },
    };
  }

  // ── Handle missing user defensively ───────────────────────
  if (!data.user) {
    return {
      success: false,
      error: { code: "unexpected", message: "No user returned from sign-up" },
    };
  }

  // ── Return user (ignore session entirely) ─────────────────
  return { success: true, data: toAuthUser(data.user) };
}
