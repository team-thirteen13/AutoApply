// ─────────────────────────────────────────────────────────────
// Auth Error Code → Safe User-Facing Message Map
// ─────────────────────────────────────────────────────────────
// Never exposes raw Supabase error text, status codes,
// stack traces, or internal codes to the user.
// ─────────────────────────────────────────────────────────────

import type { AuthErrorCode } from "@/types/auth";

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials:
    "Invalid email or password. Please check your credentials and try again.",
  email_not_confirmed:
    "Please check your email and confirm your account before signing in.",
  email_exists:
    "An account with this email already exists. Try signing in instead.",
  weak_password:
    "Password is too weak. Use at least 8 characters with a mix of letters and numbers.",
  invalid_email:
    "Please enter a valid email address.",
  rate_limited:
    "Too many attempts. Please wait a moment and try again.",
  user_not_found:
    "No account found with this email. Please register first.",
  session_expired:
    "Your session has expired. Please sign in again.",
  session_missing:
    "No active session. Please sign in.",
  oauth_failed:
    "Social login failed. Please try again or use email sign-in.",
  invalid_password:
    "Please enter a valid password.",
  invalid_redirect:
    "Invalid redirect URL. Please try again.",
  unexpected:
    "Something went wrong. Please try again later.",
};

/**
 * Map an AuthErrorCode to a safe, user-facing message.
 * Never returns raw backend text.
 */
export function getAuthErrorMessage(code: AuthErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unexpected;
}
