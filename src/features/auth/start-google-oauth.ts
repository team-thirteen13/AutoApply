// ─────────────────────────────────────────────────────────────
// Google OAuth Initiation
// ─────────────────────────────────────────────────────────────
// Starts the Google OAuth flow by returning the provider
// authorization URL. Uses skipBrowserRedirect so the caller
// controls navigation. Never exposes tokens or sessions.
//
// Origin is derived from the incoming request URL and validated
// against the ALLOWED_ORIGINS environment variable. This avoids
// hard-coded ports and works in both local and production.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { startOAuthSchema } from "@/lib/validation/auth";
import { type AuthOperationResult } from "@/types/auth";
import { mapAuthErrorCode } from "./map-auth-error";

// ── Origin validation ──────────────────────────────────────

/**
 * Parse the ALLOWED_ORIGINS env var into a Set of lowercase origins.
 * Supports comma-separated values, e.g.:
 *   "http://localhost:3000,https://auto-apply-pied.vercel.app"
 */
function getAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Derive and validate the trusted origin from the request URL.
 *
 * Strategy:
 * 1. If ALLOWED_ORIGINS is set, the request origin must be in the list.
 * 2. If ALLOWED_ORIGINS is not set, allow any localhost:3000 in development
 *    (NODE_ENV !== "production") and reject all other origins.
 *
 * Returns the validated origin string or throws with a safe message.
 */
function deriveTrustedOrigin(requestUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl);
  } catch {
    throw new Error("Invalid request URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Request must use http or https protocol");
  }

  const origin = parsed.origin.toLowerCase();
  const allowed = getAllowedOrigins();

  // If an explicit allowlist is configured, check against it
  if (allowed.size > 0) {
    if (!allowed.has(origin)) {
      throw new Error("Request origin is not in the allowed origins list");
    }
    return origin;
  }

  // No allowlist configured — use environment-based defaults
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev && origin === "http://localhost:3000") {
    return origin;
  }

  // Production without ALLOWED_ORIGINS: derive from request as fallback
  // (Vercel sets VERCEL_URL; local dev uses localhost:3000)
  if (!isDev) {
    const vercelUrl = process.env.VERCEL_URL;
    const expectedOrigin = vercelUrl
      ? `https://${vercelUrl}`
      : process.env.APP_URL;
    if (expectedOrigin && origin === expectedOrigin.toLowerCase()) {
      return origin;
    }
  }

  throw new Error(
    "Request origin is not trusted. Configure ALLOWED_ORIGINS to allow this origin.",
  );
}

// ── Main function ──────────────────────────────────────────

export async function startGoogleOAuth(
  input: unknown,
  request: Request,
): Promise<AuthOperationResult<{ url: string }>> {
  // ── Validate nextPath ────────────────────────────────────
  const parsed = startOAuthSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "invalid_redirect",
        message: parsed.error.issues[0].message,
      },
    };
  }

  const nextPath = parsed.data.nextPath;

  // ── Derive trusted origin from request ───────────────────
  let callbackUrl: string;
  try {
    const origin = deriveTrustedOrigin(request.url);
    const url = new URL("/auth/callback", origin);
    url.searchParams.set("next", nextPath);
    callbackUrl = url.toString();
  } catch (err) {
    // Safe error logging — never expose request URL or env values
    console.error("[OAuth] Origin validation failed:", err);
    return {
      success: false,
      error: {
        code: "unexpected",
        message: "Authentication configuration is unavailable",
      },
    };
  }

  // ── Call Supabase ────────────────────────────────────────
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return {
      success: false,
      error: { code: mapAuthErrorCode(error), message: error.message },
    };
  }

  // ── Handle missing URL defensively ───────────────────────
  if (!data.url) {
    return {
      success: false,
      error: {
        code: "unexpected",
        message: "No authorization URL returned from OAuth provider",
      },
    };
  }

  // ── Return authorization URL only ────────────────────────
  return { success: true, data: { url: data.url } };
}
