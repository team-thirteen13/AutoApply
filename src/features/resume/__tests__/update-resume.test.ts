import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

// Read chain: from → select → eq → eq → maybeSingle
const mockReadMaybeSingle = vi.fn();
const mockReadEq2 = vi.fn();
const mockReadEq1 = vi.fn();
const mockReadSelect = vi.fn();
const mockReadFrom = vi.fn(() => ({ select: mockReadSelect }));
mockReadSelect.mockReturnValue({ eq: mockReadEq1 });
mockReadEq1.mockReturnValue({ eq: mockReadEq2 });
mockReadEq2.mockReturnValue({ maybeSingle: mockReadMaybeSingle });

// Update chain: from → update → eq → eq → select → maybeSingle
const mockUpdateMaybeSingle = vi.fn();
const mockUpdateSelect = vi.fn();
const mockUpdateEq2 = vi.fn();
const mockUpdateEq1 = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateFrom = vi.fn(() => ({ update: mockUpdate }));
mockUpdate.mockReturnValue({ eq: mockUpdateEq1 });
mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 });
mockUpdateEq2.mockReturnValue({ select: mockUpdateSelect });
mockUpdateSelect.mockReturnValue({ maybeSingle: mockUpdateMaybeSingle });

const mockFrom = vi.fn()
  .mockReturnValueOnce({ select: mockReadSelect })
  .mockReturnValueOnce({ update: mockUpdate });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { updateResume } from "../update-resume";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

const DB_ROW = {
  id: VALID_ID,
  user_id: "user-123",
  title: "Updated Title",
  target_role: "Tech Lead",
  file_path: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

describe("updateResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
    // Reset mockFrom to return read chain first, then update chain
    mockFrom.mockReset();
    mockFrom
      .mockReturnValueOnce({ select: mockReadSelect })
      .mockReturnValueOnce({ update: mockUpdate });
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await updateResume("not-a-uuid", { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns validation_error for empty update", async () => {
    const result = await updateResume(VALID_ID, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await updateResume(VALID_ID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct read and update queries", async () => {
    mockReadMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });
    mockUpdateMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await updateResume(VALID_ID, { title: "Updated Title" });

    // Read query
    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockReadSelect).toHaveBeenCalledWith(
      "id, user_id, title, target_role, file_path, created_at, updated_at",
    );
    expect(mockReadEq1).toHaveBeenCalledWith("id", VALID_ID);
    expect(mockReadEq2).toHaveBeenCalledWith("user_id", "user-123");
    // Update query
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateEq1).toHaveBeenCalledWith("id", VALID_ID);
    expect(mockUpdateEq2).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("returns mapped resume", async () => {
    mockReadMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });
    mockUpdateMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await updateResume(VALID_ID, { title: "Updated Title" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated Title");
      expect(result.data.targetRole).toBe("Tech Lead");
    }
  });

  it("returns resume_not_found when missing", async () => {
    mockReadMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await updateResume(VALID_ID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns unexpected on read Supabase error", async () => {
    mockReadMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await updateResume(VALID_ID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await updateResume(VALID_ID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
