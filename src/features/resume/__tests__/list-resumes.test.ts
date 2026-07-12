import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ order: mockOrder });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { listResumes } from "../list-resumes";

const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const DB_ROW = {
  id: "resume-1",
  user_id: "user-123",
  title: "Software Engineer",
  target_role: "Senior Engineer",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

const MAPPED = {
  id: "resume-1",
  userId: "user-123",
  title: "Software Engineer",
  targetRole: "Senior Engineer",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
};

describe("listResumes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await listResumes();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query chain", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    await listResumes();

    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockSelect).toHaveBeenCalledWith(
      "id, user_id, title, target_role, created_at, updated_at",
    );
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns mapped resumes", async () => {
    mockOrder.mockResolvedValue({ data: [DB_ROW], error: null });

    const result = await listResumes();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(MAPPED);
    }
  });

  it("normalizes null data to empty array", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await listResumes();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await listResumes();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await listResumes();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
