// ─────────────────────────────────────────────────────────────
// Authentication Types
// ─────────────────────────────────────────────────────────────
// Shared type contracts for authentication operations.
// Used by auth UI (Member 2), auth services, and API routes.
//
// Input types (SignUpInput, SignInInput) are defined via Zod
// inference in src/lib/validation/auth.ts — not here.
// ─────────────────────────────────────────────────────────────

// ── User snapshot ───────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
  createdAt: string;
}

// ── Structured error (for operation results) ────────────────

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthErrorCode =
  | "invalid_email"
  | "invalid_password"
  | "email_not_confirmed"
  | "invalid_credentials"
  | "user_not_found"
  | "session_expired"
  | "session_missing"
  | "unexpected";

// ── Generic result type ─────────────────────────────────────

export type AuthOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

// ── Throwable error for auth guards ─────────────────────────

export class AuthenticationRequiredError extends Error {
  readonly code = "session_missing" as const;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}
