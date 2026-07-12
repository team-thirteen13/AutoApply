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

import { getProject } from "../get-project";

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
  title: "AutoApply",
  description: "AI-powered resume builder",
  technologies: ["Next.js", "TypeScript"],
  live_url: "https://autoapply.dev",
  playstore_url: null,
  appstore_url: null,
  git_url: "https://github.com/team/autoapply",
  image_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("getProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
  });

  it("rejects invalid ID before auth and database access", async () => {
    const result = await getProject("bad-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await getProject(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query and returns mapped project", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await getProject(VALID_UUID);

    expect(result.success).toBe(true);
    expect(mockSelect).toHaveBeenCalledWith(
      "id, user_id, title, description, technologies, live_url, playstore_url, appstore_url, git_url, image_url, created_at, updated_at",
    );
    expect(mockEq).toHaveBeenCalledWith("id", VALID_UUID);
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    if (result.success) {
      expect(result.data.title).toBe("AutoApply");
      expect(result.data.technologies).toEqual(["Next.js", "TypeScript"]);
    }
  });

  it("returns project_not_found when data is null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getProject(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("project_not_found");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await getProject(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await getProject(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
