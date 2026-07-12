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
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
mockInsert.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { createResume } from "../create-resume";

const DB_ROW = {
  id: "resume-1",
  user_id: "user-123",
  title: "My Resume",
  target_role: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("createResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for missing title", async () => {
    const result = await createResume({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns validation_error for empty title", async () => {
    const result = await createResume({ title: "  " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await createResume({ title: "My Resume" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct insert query", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await createResume({ title: "My Resume" });

    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      title: "My Resume",
    });
  });

  it("returns mapped resume", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await createResume({ title: "My Resume" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My Resume");
      expect(result.data.userId).toBe("user-123");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await createResume({ title: "My Resume" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected when insert returns null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await createResume({ title: "My Resume" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await createResume({ title: "My Resume" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
