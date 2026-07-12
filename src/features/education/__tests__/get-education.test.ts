import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { getEducation } from "../get-education";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const DB_ROW = {
  id: VALID_UUID,
  user_id: "user-123",
  university: "MIT",
  degree: "BS Computer Science",
  start_date: "2020-09-01",
  end_date: "2024-05-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const MAPPED = {
  id: VALID_UUID,
  userId: "user-123",
  university: "MIT",
  degree: "BS Computer Science",
  startDate: "2020-09-01",
  endDate: "2024-05-15",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("getEducation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
  });

  it("rejects invalid IDs before auth and database access", async () => {
    const invalidIds = ["", null, undefined, "not-a-uuid", "550e8400-e29b-41d4-a716"];

    for (const id of invalidIds) {
      vi.clearAllMocks();
      mockRequireAuthenticatedUser.mockResolvedValue(USER);

      const result = await getEducation(id as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("validation_error");
      }
      expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await getEducation(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query chain", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await getEducation(VALID_UUID);

    expect(mockSelect).toHaveBeenCalledWith(
      "id, user_id, university, degree, start_date, end_date, created_at, updated_at",
    );
    expect(mockEq).toHaveBeenCalledWith("id", VALID_UUID);
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
  });

  it("returns mapped education with snake_case to camelCase conversion", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await getEducation(VALID_UUID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(MAPPED);
    }
  });

  it("returns education_not_found when data is null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getEducation(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("education_not_found");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await getEducation(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).toBe("An unexpected error occurred");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await getEducation(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
