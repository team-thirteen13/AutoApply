import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
mockInsert.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { createEducation } from "../create-education";

const VALID_INPUT = {
  university: "MIT",
  degree: "BS Computer Science",
  startDate: "2020-09-01",
  endDate: "2024-05-15",
};

const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const DB_ROW = {
  id: "edu-1",
  user_id: "user-123",
  university: "MIT",
  degree: "BS Computer Science",
  start_date: "2020-09-01",
  end_date: "2024-05-15",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("createEducation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("rejects invalid input before auth and database access", async () => {
    const result = await createEducation({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects empty university", async () => {
    const result = await createEducation({
      ...VALID_INPUT,
      university: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("rejects empty degree", async () => {
    const result = await createEducation({
      ...VALID_INPUT,
      degree: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("rejects endDate before startDate", async () => {
    const result = await createEducation({
      ...VALID_INPUT,
      endDate: "2019-01-01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await createEducation(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct insert and returns mapped education", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await createEducation(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      university: "MIT",
      degree: "BS Computer Science",
      start_date: "2020-09-01",
      end_date: "2024-05-15",
    });
    if (result.success) {
      expect(result.data.university).toBe("MIT");
      expect(result.data.startDate).toBe("2020-09-01");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await createEducation(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await createEducation(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
