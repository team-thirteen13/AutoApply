import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq2 = vi.fn();
const mockEq1 = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn(() => ({ delete: mockDelete }));
mockDelete.mockReturnValue({ eq: mockEq1 });
mockEq1.mockReturnValue({ eq: mockEq2 });
mockEq2.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { deleteResume } from "../delete-resume";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("deleteResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await deleteResume("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await deleteResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct delete query", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: VALID_ID }, error: null });

    await deleteResume(VALID_ID);

    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq1).toHaveBeenCalledWith("id", VALID_ID);
    expect(mockEq2).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockSelect).toHaveBeenCalledWith("id");
  });

  it("returns success on delete", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: VALID_ID }, error: null });

    const result = await deleteResume(VALID_ID);

    expect(result.success).toBe(true);
  });

  it("returns resume_not_found when no row deleted", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await deleteResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "err" },
    });

    const result = await deleteResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await deleteResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
