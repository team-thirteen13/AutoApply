import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockMaybeSingle = vi.fn();
const mockEq2 = vi.fn();
const mockEq1 = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ eq: mockEq1 });
mockEq1.mockReturnValue({ eq: mockEq2 });
mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { getResume } from "../get-resume";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

const DB_ROW = {
  id: VALID_ID,
  user_id: "user-123",
  title: "Software Engineer",
  target_role: null,
  file_path: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

const MAPPED = {
  id: VALID_ID,
  userId: "user-123",
  title: "Software Engineer",
  targetRole: null,
  filePath: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
};

describe("getResume", () => {
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
    const result = await getResume("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await getResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query chain", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await getResume(VALID_ID);

    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockSelect).toHaveBeenCalledWith(
      "id, user_id, title, target_role, file_path, created_at, updated_at",
    );
    expect(mockEq1).toHaveBeenCalledWith("id", VALID_ID);
    expect(mockEq2).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("returns mapped resume", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await getResume(VALID_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(MAPPED);
    }
  });

  it("returns resume_not_found when missing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await getResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await getResume(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
