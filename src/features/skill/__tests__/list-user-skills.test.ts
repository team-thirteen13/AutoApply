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

import { listUserSkills } from "../list-user-skills";

describe("listUserSkills", () => {
  beforeEach(() => {
    mockRequireAuthenticatedUser.mockReset();
    mockFrom.mockReset();
  });

  it("returns authentication_required when not authenticated", async () => {
    const { AuthenticationRequiredError } = await import("@/types/auth");
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await listUserSkills();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("queries user_skills table", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockOrder = vi.fn();
    mockOrder.mockResolvedValue({ data: [], error: null });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    await listUserSkills();

    expect(mockFrom).toHaveBeenCalledWith("user_skills");
  });

  it("returns unexpected on Supabase error", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const mockOrder = vi.fn();
    mockOrder.mockResolvedValue({ data: null, error: { code: "err" } });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listUserSkills();

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("unexpected");
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("boom"));

    const result = await listUserSkills();

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("unexpected");
  });
});
