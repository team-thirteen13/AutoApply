// ─────────────────────────────────────────────────────────────
// Google OAuth Initiation
// ─────────────────────────────────────────────────────────────
// Starts the Google OAuth flow by returning the provider
// authorization URL. Uses skipBrowserRedirect so the caller
// controls navigation. Never exposes tokens or sessions.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { startOAuthSchema } from "@/lib/validation/auth";
import { type AuthOperationResult } from "@/types/auth";
import { mapAuthErrorCode } from "./map-auth-error";

// ── Trusted application origin ──────────────────────────────

function getTrustedOrigin(): string {
  const value = process.env.APP_URL;
  if (!value) {
    throw new Error("Missing environment variable: APP_URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("APP_URL is not a valid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("APP_URL must use http or https protocol");
  }

  // Reject credentials, query strings, fragments, non-root paths
  if (parsed.username || parsed.password) {
    throw new Error("APP_URL must not contain credentials");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("APP_URL must not contain query strings or fragments");
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error("APP_URL must be a root origin");
  }

  // Normalize trailing slash
  return parsed.origin;
}

// ── Main function ──────────────────────────────────────────

export async function startGoogleOAuth(
  input: unknown,
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

  // ── Build callback URL ───────────────────────────────────
  let callbackUrl: string;
  try {
    const origin = getTrustedOrigin();
    const url = new URL("/auth/callback", origin);
    url.searchParams.set("next", nextPath);
    callbackUrl = url.toString();
  } catch {
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
