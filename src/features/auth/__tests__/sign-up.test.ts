// ─────────────────────────────────────────────────────────────
// Sign-Up Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/features/auth/sign-up.ts
// Mocks server-only and Supabase server client.
// No real network calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}));

import { signUp } from "../sign-up";

describe("signUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Validation ───────────────────────────────────────────

  describe("validation", () => {
    it("rejects invalid email", async () => {
      const result = await signUp({ email: "not-an-email", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_email");
      }
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("rejects short password", async () => {
      const result = await signUp({ email: "test@example.com", password: "ab" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_password");
      }
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("rejects missing fields", async () => {
      const result = await signUp({});

      expect(result.success).toBe(false);
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  // ── Error mapping ────────────────────────────────────────

  describe("error mapping", () => {
    it("maps email_exists", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "email_exists", message: "User already registered" },
      });

      const result = await signUp({ email: "dup@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("email_exists");
      }
    });

    it("maps user_already_exists to email_exists", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "user_already_exists", message: "User already registered" },
      });

      const result = await signUp({ email: "dup@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("email_exists");
      }
    });

    it("maps weak_password", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "weak_password", message: "Password too weak" },
      });

      const result = await signUp({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("weak_password");
      }
    });

    it("maps unknown codes to unexpected", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: "some_new_error", message: "Something happened" },
      });

      const result = await signUp({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
      }
    });
  });

  // ── Success ──────────────────────────────────────────────

  describe("success", () => {
    it("returns AuthUser without session (autoconfirm OFF)", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: "new@example.com",
            email_confirmed_at: null,
            created_at: "2026-01-01T00:00:00Z",
          },
          session: null,
        },
        error: null,
      });

      const result = await signUp({ email: "new@example.com", password: "Valid123!" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: "user-123",
          email: "new@example.com",
          emailConfirmed: false,
          createdAt: "2026-01-01T00:00:00Z",
        });
        expect(result.data).not.toHaveProperty("session");
        expect(result.data).not.toHaveProperty("access_token");
      }
    });

    it("returns AuthUser and ignores session (autoconfirm ON)", async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: "user-456",
            email: "confirmed@example.com",
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

      const result = await signUp({ email: "confirmed@example.com", password: "Valid123!" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailConfirmed).toBe(true);
        expect(result.data).not.toHaveProperty("session");
        expect(result.data).not.toHaveProperty("access_token");
      }
    });
  });

  // ── Defensive handling ───────────────────────────────────

  describe("missing user", () => {
    it("handles missing user defensively", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await signUp({ email: "test@example.com", password: "Valid123!" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("unexpected");
        expect(result.error.message).toContain("No user returned");
      }
    });
  });
});
