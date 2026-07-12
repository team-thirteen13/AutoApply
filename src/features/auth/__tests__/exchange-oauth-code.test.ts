// ─────────────────────────────────────────────────────────────
// exchangeOAuthCode Tests
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

  // ── Validation ──────────────────────────────────────────

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

    it("rejects overly long code", async () => {
      const longCode = "a".repeat(1025);
      const result = await exchangeOAuthCode({ code: longCode });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_redirect");
      }
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  // ── Success ─────────────────────────────────────────────

  describe("success", () => {
    it("returns AuthUser on successful exchange", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: "user-oauth-1",
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

      const result = await exchangeOAuthCode({ code: "valid-code" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: "user-oauth-1",
          email: "user@example.com",
          emailConfirmed: true,
          createdAt: "2026-01-01T00:00:00Z",
        });
      }
    });

    it("ignores session data", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: "user-oauth-2",
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

      const result = await exchangeOAuthCode({ code: "valid-code" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("session");
        expect(result.data).not.toHaveProperty("access_token");
        expect(result.data).not.toHaveProperty("refresh_token");
      }
    });

    it("returns no token or session data", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: "user-oauth-3",
            email: "user@example.com",
            email_confirmed_at: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          session: {
            access_token: "eyJhidden",
            refresh_token: "refresh-hidden",
            provider_token: "provider-hidden",
            provider_refresh_token: "provider-refresh-hidden",
          },
        },
        error: null,
      });

      const result = await exchangeOAuthCode({ code: "valid-code" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("provider_token");
        expect(result.data).not.toHaveProperty("provider_refresh_token");
      }
    });
  });

  // ── Error mapping ───────────────────────────────────────

  describe("error mapping", () => {
    it("maps bad_code_verifier to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "bad_code_verifier", message: "Code verifier mismatch" },
      });

      const result = await exchangeOAuthCode({ code: "bad-code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("maps bad_oauth_callback to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "bad_oauth_callback", message: "Bad callback" },
      });

      const result = await exchangeOAuthCode({ code: "bad-code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("maps flow_state_expired to oauth_failed", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "flow_state_expired", message: "Flow expired" },
      });

      const result = await exchangeOAuthCode({ code: "expired-code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("oauth_failed");
      }
    });

    it("maps unknown codes to unexpected", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "some_new_error", message: "Something happened" },
      });

      const result = await exchangeOAuthCode({ code: "code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
      }
    });
  });

  // ── Missing user ────────────────────────────────────────

  describe("missing user", () => {
    it("handles missing data.user defensively", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await exchangeOAuthCode({ code: "valid-code" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toContain("No user returned");
      }
    });
  });
});
