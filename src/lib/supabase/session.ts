// ─────────────────────────────────────────────────────────────
// Server-Side Session Utilities
// ─────────────────────────────────────────────────────────────
// Provides server-only helpers for retrieving the authenticated
// user from the Supabase session. Uses getUser() for trusted
// server-side verification (validates the JWT with Supabase).
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  AuthenticationRequiredError,
  type AuthUser,
} from "@/types/auth";

// ── Get authenticated user ──────────────────────────────────
// Returns the verified user, or null if not authenticated.
// Calls supabase.auth.getUser() which validates the JWT
// server-side (not just reading from cookies).

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmed: !!user.email_confirmed_at,
    createdAt: user.created_at,
  };
}

// ── Require authenticated user ──────────────────────────────
// Like getAuthenticatedUser() but throws
// AuthenticationRequiredError when not authenticated.

export async function requireAuthenticatedUser(): Promise<AuthUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthenticationRequiredError();
  }

  return user;
}
