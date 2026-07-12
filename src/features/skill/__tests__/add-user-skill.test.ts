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

import { addUserSkill } from "../add-user-skill";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("addUserSkill", () => {
  beforeEach(() => {
    mockRequireAuthenticatedUser.mockReset();
    mockFrom.mockReset();
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await addUserSkill("not-a-uuid");

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

    const result = await addUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("queries skills table for existence check", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingle = vi.fn();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    await addUserSkill(VALID_ID);

    expect(mockFrom).toHaveBeenCalledWith("skills");
  });

  it("returns skill_not_found when skill does not exist", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingle = vi.fn();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await addUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("skill_not_found");
    }
  });

  it("returns user_skill_already_exists when duplicate association", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingleSkill = vi.fn();
    mockMaybeSingleSkill.mockResolvedValue({
      data: { id: VALID_ID, name: "TypeScript" },
      error: null,
    });
    const mockEqSkill = vi.fn();
    mockEqSkill.mockReturnValue({ maybeSingle: mockMaybeSingleSkill });
    const mockSelectSkill = vi.fn();
    mockSelectSkill.mockReturnValue({ eq: mockEqSkill });

    const mockMaybeSingleExisting = vi.fn();
    mockMaybeSingleExisting.mockResolvedValue({
      data: { user_id: "user-1", skill_id: VALID_ID },
      error: null,
    });
    const mockEqExisting2 = vi.fn();
    mockEqExisting2.mockReturnValue({ maybeSingle: mockMaybeSingleExisting });
    const mockEqExisting1 = vi.fn();
    mockEqExisting1.mockReturnValue({ eq: mockEqExisting2 });
    const mockSelectExisting = vi.fn();
    mockSelectExisting.mockReturnValue({ eq: mockEqExisting1 });

    mockFrom
      .mockReturnValueOnce({ select: mockSelectSkill })
      .mockReturnValueOnce({ select: mockSelectExisting });

    const result = await addUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("user_skill_already_exists");
    }
  });

  it("returns unexpected on Supabase error during skill lookup", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockMaybeSingle = vi.fn();
    mockMaybeSingle.mockResolvedValue({ data: null, error: { code: "err" } });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await addUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("boom"));

    const result = await addUserSkill(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
