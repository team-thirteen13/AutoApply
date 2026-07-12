import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockRequireAuthenticatedUser, mockFrom } = vi.hoisted(() => ({
  mockRequireAuthenticatedUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { removeUserSkill } from "../remove-user-skill";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("removeUserSkill", () => {
  beforeEach(() => {
    mockRequireAuthenticatedUser.mockReset();
    mockFrom.mockReset();
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await removeUserSkill("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    const { AuthenticationRequiredError } = await import("@/types/auth");
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await removeUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("queries user_skills table", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingle = vi.fn();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const mockEq2 = vi.fn();
    mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq1 = vi.fn();
    mockEq1.mockReturnValue({ eq: mockEq2 });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelect });

    await removeUserSkill(VALID_ID);

    expect(mockFrom).toHaveBeenCalledWith("user_skills");
  });

  it("returns user_skill_not_found when association does not exist", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingle = vi.fn();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const mockEq2 = vi.fn();
    mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq1 = vi.fn();
    mockEq1.mockReturnValue({ eq: mockEq2 });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await removeUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("user_skill_not_found");
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("boom"));

    const result = await removeUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("unexpected");
  });
});
