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

import { createProject } from "../create-project";

const VALID_INPUT = {
  title: "AutoApply",
  description: "AI-powered resume builder",
  technologies: ["Next.js", "TypeScript"],
  liveUrl: "https://autoapply.dev",
};

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
  technologies: ["Next.js", "TypeScript"],
  live_url: "https://autoapply.dev",
  playstore_url: null,
  appstore_url: null,
  git_url: null,
  image_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("createProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(USER);
  });

  it("rejects invalid input before auth and database access", async () => {
    const result = await createProject({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
    expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects empty title", async () => {
    const result = await createProject({
      ...VALID_INPUT,
      title: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("rejects empty description", async () => {
    const result = await createProject({
      ...VALID_INPUT,
      description: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("rejects invalid liveUrl", async () => {
    const result = await createProject({
      ...VALID_INPUT,
      liveUrl: "not-a-url",
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

    const result = await createProject(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("builds correct insert and returns mapped project", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const result = await createProject(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      title: "AutoApply",
      description: "AI-powered resume builder",
      technologies: ["Next.js", "TypeScript"],
      live_url: "https://autoapply.dev",
    });
    if (result.success) {
      expect(result.data.title).toBe("AutoApply");
      expect(result.data.technologies).toEqual(["Next.js", "TypeScript"]);
    }
  });

  it("omits undefined optional fields from insert", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const input = { title: "Test", description: "Desc" };
    await createProject(input);

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg).not.toHaveProperty("live_url");
    expect(insertArg).not.toHaveProperty("playstore_url");
    expect(insertArg).not.toHaveProperty("appstore_url");
    expect(insertArg).not.toHaveProperty("git_url");
    expect(insertArg).not.toHaveProperty("image_url");
  });

  it("preserves explicit null values in insert", async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_ROW, error: null });

    const input = {
      title: "Test",
      description: "Desc",
      liveUrl: null,
      playstoreUrl: null,
    };
    await createProject(input);

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.live_url).toBeNull();
    expect(insertArg.playstore_url).toBeNull();
  });

  it("returns unexpected on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await createProject(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on null insert result", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await createProject(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await createProject(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
