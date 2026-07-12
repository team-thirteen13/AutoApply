// ─────────────────────────────────────────────────────────────
// OAuth Code Exchange
// ─────────────────────────────────────────────────────────────
// Exchanges an OAuth authorization code for a session via
// Supabase. Returns only the AuthUser snapshot. Never exposes
// tokens, session, provider_token, or provider_refresh_token.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { exchangeCodeSchema } from "@/lib/validation/auth";
import { type AuthUser, type AuthOperationResult } from "@/types/auth";
import { mapAuthErrorCode } from "./map-auth-error";
import { toAuthUser } from "./auth-user";

export async function exchangeOAuthCode(
  input: unknown,
): Promise<AuthOperationResult<AuthUser>> {
  // ── Validate code ────────────────────────────────────────
  const parsed = exchangeCodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "invalid_redirect",
        message: parsed.error.issues[0].message,
      },
    };
  }

  // ── Call Supabase ────────────────────────────────────────
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    parsed.data.code,
  );

  if (error) {
    return {
      success: false,
      error: { code: mapAuthErrorCode(error), message: error.message },
    };
  }

  // ── Handle missing user defensively ──────────────────────
  if (!data.user) {
    return {
      success: false,
      error: {
        code: "unexpected",
        message: "No user returned from OAuth code exchange",
      },
    };
  }

  // ── Return user (ignore session entirely) ────────────────
  return { success: true, data: toAuthUser(data.user) };
}
