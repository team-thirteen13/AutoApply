import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn(() => ({ update: mockUpdate }));
mockUpdate.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ eq: mockEq, select: mockSelect });
mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { updateEducation } from "../update-education";

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
  degree: "MS Computer Science",
  start_date: "2020-09-01",
  end_date: "2024-05-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

describe("updateEducation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
    mockEq.mockReturnValue({ eq: mockEq, select: mockSelect });
  });

  it("rejects invalid ID before auth and database access", async () => {
    const result = await updateEducation("bad-id", { university: "MIT" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects empty update payload", async () => {
    const result = await updateEducation(VALID_UUID, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await updateEducation(VALID_UUID, { university: "MIT" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct update query and returns mapped education", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await updateEducation(VALID_UUID, {
      degree: "MS Computer Science",
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ degree: "MS Computer Science" });
    if (result.success) {
      expect(result.data.degree).toBe("MS Computer Science");
    }
  });

  it("returns education_not_found when data is null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await updateEducation(VALID_UUID, { university: "Stanford" });

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

    const result = await updateEducation(VALID_UUID, { university: "MIT" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await updateEducation(VALID_UUID, { university: "MIT" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
