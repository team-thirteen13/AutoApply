/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockSignInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// ── Import after mocks ─────────────────────────────────────

import { startGoogleOAuth } from "@/features/auth/start-google-oauth";

// ── Helpers ────────────────────────────────────────────────

function makeRequest(url: string): Request {
  return new Request(url, { method: "POST" });
}

function mockOAuthSuccess() {
  mockSignInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.com/o/oauth2/auth?client_id=test" },
    error: null,
  });
}

function mockOAuthError(code = "bad_oauth_callback", message = "Provider error") {
  mockSignInWithOAuth.mockResolvedValue({
    data: null,
    error: { code, message, status: 400 },
  });
}

// ── Tests ──────────────────────────────────────────────────

describe("startGoogleOAuth — origin validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockOAuthSuccess();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Local origin ─────────────────────────────────────────

  describe("local development origin", () => {
    it("accepts http://localhost:3000 when NODE_ENV is not production", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toContain("accounts.google.com");
      }
    });

    it("passes nextPath to callback URL", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      await startGoogleOAuth({ nextPath: "/profile" }, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toContain("next=%2Fprofile");
    });

    it("defaults nextPath to / when not provided", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      await startGoogleOAuth({}, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.redirectTo).toContain("next=%2F");
    });
  });

  // ── Production origin ────────────────────────────────────

  describe("production origin", () => {
    it("accepts origin in ALLOWED_ORIGINS list", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://auto-apply-pied.vercel.app",
      );

      const request = makeRequest(
        "https://auto-apply-pied.vercel.app/api/auth/oauth/google",
      );
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(true);
      if (result.success) {
        const callArgs = mockSignInWithOAuth.mock.calls[0][0];
        expect(callArgs.options.redirectTo).toContain(
          "auto-apply-pied.vercel.app",
        );
      }
    });

    it("builds correct callback URL for production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "https://auto-apply-pied.vercel.app");

      const request = makeRequest(
        "https://auto-apply-pied.vercel.app/api/auth/oauth/google",
      );
      await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      const redirectTo = callArgs.options.redirectTo;
      const url = new URL(redirectTo);
      expect(url.origin).toBe("https://auto-apply-pied.vercel.app");
      expect(url.pathname).toBe("/auth/callback");
      expect(url.searchParams.get("next")).toBe("/dashboard");
    });

    it("falls back to APP_URL when ALLOWED_ORIGINS is not set in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "");
      vi.stubEnv("APP_URL", "https://auto-apply-pied.vercel.app");

      const request = makeRequest(
        "https://auto-apply-pied.vercel.app/api/auth/oauth/google",
      );
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(true);
    });
  });

  // ── Invalid origin ───────────────────────────────────────

  describe("invalid origin", () => {
    it("rejects origin not in ALLOWED_ORIGINS list", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "https://auto-apply-pied.vercel.app");

      const request = makeRequest("http://evil.com/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toBe(
          "Authentication configuration is unavailable",
        );
      }
    });

    it("rejects http when only https is allowed", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "https://auto-apply-pied.vercel.app");

      const request = makeRequest(
        "http://auto-apply-pied.vercel.app/api/auth/oauth/google",
      );
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
    });

    it("rejects localhost in production when not in ALLOWED_ORIGINS", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "https://auto-apply-pied.vercel.app");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
    });

    it("does not expose request URL in error message", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOWED_ORIGINS", "https://safe.example.com");

      const request = makeRequest("http://evil.com/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).not.toContain("evil.com");
        expect(result.error.message).not.toContain("http://");
      }
    });
  });

  // ── Callback URL ─────────────────────────────────────────

  describe("callback URL", () => {
    it("always points to /auth/callback", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      const redirectTo = new URL(callArgs.options.redirectTo);
      expect(redirectTo.pathname).toBe("/auth/callback");
    });

    it("includes next parameter in callback URL", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      await startGoogleOAuth({ nextPath: "/resumes" }, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      const redirectTo = new URL(callArgs.options.redirectTo);
      expect(redirectTo.searchParams.get("next")).toBe("/resumes");
    });

    it("uses skipBrowserRedirect: true", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      const callArgs = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArgs.options.skipBrowserRedirect).toBe(true);
    });
  });

  // ── next parameter validation ────────────────────────────

  describe("next parameter", () => {
    it("rejects absolute URL as nextPath", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth(
        { nextPath: "https://evil.com" },
        request,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
    });

    it("rejects protocol-relative URL as nextPath", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth(
        { nextPath: "//evil.com" },
        request,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
    });

    it("accepts valid relative path", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth(
        { nextPath: "/dashboard" },
        request,
      );

      expect(result.success).toBe(true);
    });
  });

  // ── Supabase errors ──────────────────────────────────────

  describe("Supabase errors", () => {
    it("returns oauth_failed on Supabase error", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");
      mockOAuthError("bad_oauth_callback", "provider rejected");

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("returns unexpected when Supabase returns no URL", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("ALLOWED_ORIGINS", "");
      mockSignInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      });

      const request = makeRequest("http://localhost:3000/api/auth/oauth/google");
      const result = await startGoogleOAuth({ nextPath: "/dashboard" }, request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
      }
    });
  });
});
