// ─────────────────────────────────────────────────────────────
// Sign-In Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/features/auth/sign-in.ts
// Mocks server-only and Supabase server client.
// No real network calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSignIn = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: mockSignIn },
  })),
}));

import { signIn } from "../sign-in";

describe("signIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Validation ───────────────────────────────────────────

  describe("validation", () => {
    it("rejects invalid email", async () => {
      const result = await signIn({ email: "bad", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_email");
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("rejects empty password", async () => {
      const result = await signIn({ email: "test@example.com", password: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_password");
      }
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("rejects missing fields", async () => {
      const result = await signIn({});

      expect(result.success).toBe(false);
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  // ── Error mapping ────────────────────────────────────────

  describe("error mapping", () => {
    it("maps invalid_credentials", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "invalid_credentials", message: "Invalid login credentials" },
      });

      const result = await signIn({ email: "test@example.com", password: "Wrong123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_credentials");
      }
    });

    it("maps email_not_confirmed", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "email_not_confirmed", message: "Email not confirmed" },
      });

      const result = await signIn({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("email_not_confirmed");
      }
    });

    it("maps over_request_rate_limit to rate_limited", async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "over_request_rate_limit", message: "Rate limit exceeded" },
      });

      const result = await signIn({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("rate_limited");
      }
    });
  });

  // ── Success ──────────────────────────────────────────────

  describe("success", () => {
    it("returns AuthUser and ignores session", async () => {
      mockSignIn.mockResolvedValue({
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

      const result = await signIn({ email: "user@example.com", password: "Valid123!" });

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
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await signIn({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toContain("No user returned");
      }
    });
  });
});
