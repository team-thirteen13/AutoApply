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
const mockOrder = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ order: mockOrder });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { listProjects } from "../list-projects";

const USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const DB_ROW = {
  id: "proj-1",
  user_id: "user-123",
  title: "AutoApply",
  description: "AI-powered resume builder",
  technologies: ["Next.js", "TypeScript", "Supabase"],
  live_url: "https://autoapply.dev",
  playstore_url: null,
  appstore_url: null,
  git_url: "https://github.com/team/autoapply",
  image_url: "https://example.com/screenshot.png",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const MAPPED = {
  id: "proj-1",
  userId: "user-123",
  title: "AutoApply",
  description: "AI-powered resume builder",
  technologies: ["Next.js", "TypeScript", "Supabase"],
  liveUrl: "https://autoapply.dev",
  playstoreUrl: null,
  appstoreUrl: null,
  gitUrl: "https://github.com/team/autoapply",
  imageUrl: "https://example.com/screenshot.png",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("listProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await listProjects();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct query chain", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    await listProjects();

    expect(mockSelect).toHaveBeenCalledWith(
      "id, user_id, title, description, technologies, live_url, playstore_url, appstore_url, git_url, image_url, created_at, updated_at",
    );
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns mapped projects with snake_case to camelCase conversion", async () => {
    mockOrder.mockResolvedValue({ data: [DB_ROW], error: null });

    const result = await listProjects();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(MAPPED);
    }
  });

  it("normalizes null data to empty array", async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await listProjects();

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

    const result = await listProjects();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).toBe("An unexpected error occurred");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await listProjects();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
