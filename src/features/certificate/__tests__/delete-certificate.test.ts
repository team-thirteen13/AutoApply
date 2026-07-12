import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

let eqCallCount = 0;
let eqResult: Record<string, unknown> = { error: null };
const mockEq = vi.fn(() => {
  eqCallCount++;
  return eqCallCount === 1 ? { eq: mockEq } : eqResult;
});
const mockDelete = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ delete: mockDelete }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { deleteCertificate } from "../delete-certificate";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("deleteCertificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqCallCount = 0;
    eqResult = { error: null };
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("rejects invalid ID before auth and database access", async () => {
    const result = await deleteCertificate("bad-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await deleteCertificate(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct delete query and returns success", async () => {
    const result = await deleteCertificate(VALID_UUID);

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", VALID_UUID);
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("returns unexpected on Supabase error", async () => {
    eqResult = { error: { code: "some_error", message: "Database error" } };

    const result = await deleteCertificate(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await deleteCertificate(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
