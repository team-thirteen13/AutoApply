// ─────────────────────────────────────────────────────────────
// startGoogleOAuth Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/features/auth/start-google-oauth.ts
// Mocks server-only, Supabase server client, and APP_URL env.
// No real network calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSignInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  })),
}));

import { startGoogleOAuth } from "../start-google-oauth";

const TRUSTED_ORIGIN = "https://autoapply.example.com";

describe("startGoogleOAuth", () => {
  const originalEnv = process.env.APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_URL = TRUSTED_ORIGIN;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalEnv;
    }
  });

  // ── nextPath validation ─────────────────────────────────

  describe("nextPath validation", () => {
    it("defaults nextPath to /", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth" },
        error: null,
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(true);
      if (result.success) {
        const calledWith = mockSignInWithOAuth.mock.calls[0][0];
        expect(calledWith.options.redirectTo).toContain("next=%2F");
      }
    });

    it("rejects protocol-relative paths", async () => {
      const result = await startGoogleOAuth({ nextPath: "//evil.com" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });

    it("rejects absolute external URLs", async () => {
      const result = await startGoogleOAuth({ nextPath: "https://evil.com" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });

    it("rejects backslashes", async () => {
      const result = await startGoogleOAuth({ nextPath: "/foo\\bar" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });

    it("rejects control characters", async () => {
      const result = await startGoogleOAuth({ nextPath: "/foo\x00bar" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });

    it("rejects overly long paths", async () => {
      const longPath = "/" + "a".repeat(600);
      const result = await startGoogleOAuth({ nextPath: longPath });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });
  });

  // ── APP_URL configuration ───────────────────────────────

  describe("APP_URL configuration", () => {
    it("rejects missing APP_URL", async () => {
      delete process.env.APP_URL;

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toBe(
          "Authentication configuration is unavailable",
        );
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });

    it("rejects invalid APP_URL", async () => {
      process.env.APP_URL = "not-a-url";

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toBe(
          "Authentication configuration is unavailable",
        );
      }
      expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    });
  });

  // ── Callback URL construction ───────────────────────────

  describe("callback URL construction", () => {
    it("builds correct callback URL", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth" },
        error: null,
      });

      await startGoogleOAuth({ nextPath: "/dashboard" });

      const calledWith = mockSignInWithOAuth.mock.calls[0][0];
      expect(calledWith.options.redirectTo).toBe(
        "https://autoapply.example.com/auth/callback?next=%2Fdashboard",
      );
    });

    it("verifies provider is google", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth" },
        error: null,
      });

      await startGoogleOAuth({});

      const calledWith = mockSignInWithOAuth.mock.calls[0][0];
      expect(calledWith.provider).toBe("google");
    });

    it("verifies skipBrowserRedirect is true", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth" },
        error: null,
      });

      await startGoogleOAuth({});

      const calledWith = mockSignInWithOAuth.mock.calls[0][0];
      expect(calledWith.options.skipBrowserRedirect).toBe(true);
    });
  });

  // ── Success ─────────────────────────────────────────────

  describe("success", () => {
    it("returns authorization URL", async () => {
      const authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=abc";
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: authUrl },
        error: null,
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe(authUrl);
      }
    });

    it("returns no tokens, provider, or session data", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth" },
        error: null,
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("session");
        expect(result.data).not.toHaveProperty("access_token");
        expect(result.data).not.toHaveProperty("provider_token");
      }
    });
  });

  // ── Missing URL ─────────────────────────────────────────

  describe("missing URL", () => {
    it("handles missing data.url defensively", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: null },
        error: null,
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toContain("No authorization URL");
      }
    });
  });

  // ── Error mapping ───────────────────────────────────────

  describe("error mapping", () => {
    it("maps documented OAuth errors to oauth_failed", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: null },
        error: { code: "bad_oauth_state", message: "Invalid OAuth state" },
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("maps unknown codes to unexpected", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: null },
        error: { code: "some_new_error", message: "Something happened" },
      });

      const result = await startGoogleOAuth({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
      }
    });
  });
});
