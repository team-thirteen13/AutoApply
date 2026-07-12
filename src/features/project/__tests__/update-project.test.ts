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

import { updateProject } from "../update-project";

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
  title: "AutoApply v2",
  description: "AI-powered resume builder",
  technologies: ["Next.js", "TypeScript"],
  live_url: "https://autoapply.dev",
  playstore_url: null,
  appstore_url: null,
  git_url: null,
  image_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

describe("updateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
    mockEq.mockReturnValue({ eq: mockEq, select: mockSelect });
  });

  it("rejects invalid ID before auth and database access", async () => {
    const result = await updateProject("bad-id", { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects empty update payload", async () => {
    const result = await updateProject(VALID_UUID, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await updateProject(VALID_UUID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct update query and returns mapped project", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await updateProject(VALID_UUID, {
      title: "AutoApply v2",
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ title: "AutoApply v2" });
    if (result.success) {
      expect(result.data.title).toBe("AutoApply v2");
    }
  });

  it("sends only changed fields in update", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await updateProject(VALID_UUID, {
      technologies: ["React", "Python"],
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      technologies: ["React", "Python"],
    });
  });

  it("preserves explicit null values in update", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await updateProject(VALID_UUID, { liveUrl: null, gitUrl: null });

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.live_url).toBeNull();
    expect(updateArg.git_url).toBeNull();
  });

  it("omits undefined fields from update", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    await updateProject(VALID_UUID, { title: "New" });

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty("description");
    expect(updateArg).not.toHaveProperty("technologies");
    expect(updateArg).not.toHaveProperty("live_url");
  });

  it("returns project_not_found when data is null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await updateProject(VALID_UUID, { title: "New" });

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

    const result = await updateProject(VALID_UUID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await updateProject(VALID_UUID, { title: "New" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
