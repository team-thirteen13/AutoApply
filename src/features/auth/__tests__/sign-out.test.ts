// ─────────────────────────────────────────────────────────────
// Sign-Out Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/features/auth/sign-out.ts
// Mocks server-only and Supabase server client.
// No real network calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSignOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
}));

import { signOut } from "../sign-out";

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut with scope: local", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await signOut();

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not use global scope", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await signOut();

    const callArg = mockSignOut.mock.calls[0][0];
    expect(callArg).not.toHaveProperty("scope", "global");
  });

  it("returns success with undefined data", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("maps error codes", async () => {
    mockSignOut.mockResolvedValue({
      error: { code: "session_not_found", message: "Session not found" },
    });

    const result = await signOut();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("session_missing");
    }
  });

  it("returns no tokens in result", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(result).not.toHaveProperty("access_token");
    expect(result).not.toHaveProperty("refresh_token");
    expect(result).not.toHaveProperty("session");
  });
});
