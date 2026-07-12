// ─────────────────────────────────────────────────────────────
// Supabase Auth Error Code Mapper
// ─────────────────────────────────────────────────────────────
// Maps Supabase Auth error.code values to our AuthErrorCode.
// Uses error.code only — never matches on error.message.
// ─────────────────────────────────────────────────────────────

import type { AuthErrorCode } from "@/types/auth";

const CODE_MAP: Record<string, AuthErrorCode> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_confirmed",
  email_exists: "email_exists",
  user_already_exists: "email_exists",
  weak_password: "weak_password",
  email_address_invalid: "invalid_email",
  email_address_not_authorized: "invalid_email",
  over_request_rate_limit: "rate_limited",
  over_email_send_rate_limit: "rate_limited",
  over_sms_send_rate_limit: "rate_limited",
  session_not_found: "session_missing",
  session_expired: "session_expired",
  user_not_found: "user_not_found",
  bad_code_verifier: "oauth_failed",
  bad_oauth_callback: "oauth_failed",
  bad_oauth_state: "oauth_failed",
  flow_state_expired: "oauth_failed",
  flow_state_not_found: "oauth_failed",
  oauth_provider_not_supported: "oauth_failed",
  pkce_code_verifier_not_found: "oauth_failed",
};

export function mapAuthErrorCode(error: { code?: string }): AuthErrorCode {
  if (!error.code) return "unexpected";
  return CODE_MAP[error.code] ?? "unexpected";
}
