// ─────────────────────────────────────────────────────────────
// OAuth Code Exchange Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/features/auth/exchange-oauth-code.ts
// Mocks server-only and Supabase server client.
// No real network calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockExchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

import { exchangeOAuthCode } from "../exchange-oauth-code";

describe("exchangeOAuthCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Validation ───────────────────────────────────────────

  describe("validation", () => {
    it("rejects missing code", async () => {
      const result = await exchangeOAuthCode({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    it("rejects empty code", async () => {
      const result = await exchangeOAuthCode({ code: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    it("rejects code exceeding max length", async () => {
      const result = await exchangeOAuthCode({ code: "a".repeat(1025) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    it("rejects non-string code", async () => {
      const result = await exchangeOAuthCode({ code: 123 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  // ── PKCE verifier missing ────────────────────────────────

  describe("PKCE verifier missing", () => {
    it("returns oauth_failed when PKCE verifier is missing", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: "pkce_code_verifier_not_found",
          message: "PKCE code verifier not found in storage",
        },
      });

      const result = await exchangeOAuthCode({ code: "fake_code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("does not expose internal error details", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: "pkce_code_verifier_not_found",
          message: "PKCE code verifier not found in storage",
        },
      });

      const result = await exchangeOAuthCode({ code: "fake_code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("OAuth authentication failed");
        expect(result.error.message).not.toContain("PKCE");
        expect(result.error.message).not.toContain("storage");
      }
    });
  });

  // ── Supabase errors ──────────────────────────────────────

  describe("error mapping", () => {
    it("maps bad_code_verifier to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "bad_code_verifier", message: "Invalid code verifier" },
      });

      const result = await exchangeOAuthCode({ code: "expired_code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
        expect(result.error.message).toBe("OAuth authentication failed");
      }
    });

    it("maps bad_oauth_callback to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "bad_oauth_callback", message: "Invalid callback" },
      });

      const result = await exchangeOAuthCode({ code: "bad_callback" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
        expect(result.error.message).toBe("OAuth authentication failed");
      }
    });

    it("maps flow_state_expired to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "flow_state_expired", message: "Flow expired" },
      });

      const result = await exchangeOAuthCode({ code: "expired_flow" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
        expect(result.error.message).toBe("OAuth authentication failed");
      }
    });

    it("maps unknown codes to unexpected", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "some_new_error", message: "Something happened" },
      });

      const result = await exchangeOAuthCode({ code: "unknown_error" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
      }
    });
  });

  // ── Success ──────────────────────────────────────────────

  describe("success", () => {
    it("returns AuthUser without session tokens", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: "user-789",
            email: "user@example.com",
            email_confirmed_at: "2026-01-01T00:00:00Z",
            created_at: "2026-01-01T00:00:00Z",
          },
          session: {
            access_token: "eyJhidden",
            refresh_token: "refresh-hidden",
          },
        },
        error: null,
      });

      const result = await exchangeOAuthCode({ code: "valid_code" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: "user-789",
          email: "user@example.com",
          emailConfirmed: true,
          createdAt: "2026-01-01T00:00:00Z",
        });
        expect(result.data).not.toHaveProperty("session");
        expect(result.data).not.toHaveProperty("access_token");
      }
    });
  });

  // ── Defensive handling ───────────────────────────────────

  describe("missing user", () => {
    it("handles missing user defensively", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await exchangeOAuthCode({ code: "valid_code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toContain("No user returned");
      }
    });
  });
});
