// ─────────────────────────────────────────────────────────────
// AuthUser Mapper
// ─────────────────────────────────────────────────────────────
// Converts a Supabase User into our AuthUser snapshot.
// Extracted to avoid duplication across sign-up and sign-in.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type { AuthUser } from "@/types/auth";

export function toAuthUser(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  created_at: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmed: !!user.email_confirmed_at,
    createdAt: user.created_at,
  };
}
