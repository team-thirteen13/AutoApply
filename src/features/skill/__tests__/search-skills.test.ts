import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ ilike: mockIlike });
mockIlike.mockReturnValue({ order: mockOrder });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { searchSkills } from "../search-skills";

const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const DB_ROW = {
  id: "skill-1",
  name: "TypeScript",
  created_at: "2024-01-01T00:00:00Z",
};

const MAPPED = {
  id: "skill-1",
  name: "TypeScript",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("searchSkills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("returns validation_error for empty query", async () => {
    const result = await searchSkills("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns validation_error for whitespace-only query", async () => {
    const result = await searchSkills("   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await searchSkills("TypeScript");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query chain with ilike", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    await searchSkills("TypeScript");

    expect(mockFrom).toHaveBeenCalledWith("skills");
    expect(mockSelect).toHaveBeenCalledWith("id, name, created_at");
    expect(mockIlike).toHaveBeenCalledWith("name", "%TypeScript%");
    expect(mockOrder).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("escapes special characters in search query", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    await searchSkills("%test_");

    expect(mockIlike).toHaveBeenCalledWith("name", "%\\%test\\_%");
  });

  it("returns mapped skills", async () => {
    mockOrder.mockResolvedValue({ data: [DB_ROW], error: null });

    const result = await searchSkills("TypeScript");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(MAPPED);
    }
  });

  it("normalizes null data to empty array", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await searchSkills("TypeScript");

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

    const result = await searchSkills("TypeScript");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).toBe("An unexpected error occurred");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await searchSkills("TypeScript");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
