// ─────────────────────────────────────────────────────────────
// Apply-to-Existing-Resume Action Tests
// ─────────────────────────────────────────────────────────────
// Tests for the server action that applies ATS optimization
// to an existing resume with ownership validation and backup.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResumeSnapshot } from "@/types/resume";

vi.mock("server-only", () => ({}));

// Mock Supabase client to avoid env var validation
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  },
}));

vi.mock("@/lib/ai", () => ({
  MockAIProvider: vi.fn().mockImplementation(function () {
    return {
      improveSummary: vi.fn(),
      improveExperience: vi.fn(),
    };
  }),
}));

vi.mock("@/features/profile/get-profile", () => ({
  getProfile: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

vi.mock("@/features/ai/generate-resume-content", () => ({
  generateResumeContent: vi.fn(),
}));

vi.mock("@/features/resume-storage", () => ({
  uploadResumeFile: vi.fn(),
  getResumeFileUrl: vi.fn(),
  deleteResumeFile: vi.fn(),
}));

vi.mock("@/features/resume-parser", () => ({
  parseResume: vi.fn(),
}));

vi.mock("@/lib/ai/optimization/groq-provider", () => ({
  GroqResumeOptimizationProvider: vi.fn(),
}));

vi.mock("@/lib/ai/optimization/openrouter-provider", () => ({
  OpenRouterResumeOptimizationProvider: vi.fn(),
}));

// ── Test Data ────────────────────────────────────────────────

const mockSnapshot: ResumeSnapshot = {
  profile: {
    name: "John Doe",
    title: "Software Engineer",
    email: "john@example.com",
  },
  summary: "Experienced software engineer.",
  experiences: [],
  skills: [],
};

const mockCurrentSnapshot: ResumeSnapshot = {
  profile: {
    name: "John Doe",
    title: "Developer",
    email: "john@example.com",
  },
  summary: "Original summary.",
  experiences: [],
  skills: [],
};

const mockResume = {
  id: "resume-123",
  userId: "user-123",
  title: "My Resume",
  targetRole: null,
  filePath: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const mockVersion = {
  id: "version-123",
  resumeId: "resume-123",
  userId: "user-123",
  snapshot: mockCurrentSnapshot,
  label: "Saved 1/1/2025",
  createdAt: "2025-01-01T00:00:00Z",
};

// ── Mocks ────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
const mockGetResume = vi.fn();
const mockListVersions = vi.fn();
const mockCreateVersion = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuth(...args),
}));

vi.mock("@/types/auth", () => ({
  AuthenticationRequiredError: class extends Error {
    name = "AuthenticationRequiredError";
    constructor(message?: string) {
      super(message || "Authentication required");
    }
  },
}));

vi.mock("@/features/resume", () => ({
  getResume: (...args: unknown[]) => mockGetResume(...args),
  listVersions: (...args: unknown[]) => mockListVersions(...args),
  createVersion: (...args: unknown[]) => mockCreateVersion(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Import after mocks
import { applyToExistingResumeAction } from "../actions";

// ── Tests ────────────────────────────────────────────────────

describe("applyToExistingResumeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });
    mockGetResume.mockResolvedValue({ success: true, data: mockResume });
    mockListVersions.mockResolvedValue({
      success: true,
      data: [mockVersion],
    });
    mockCreateVersion.mockResolvedValue({
      success: true,
      data: { ...mockVersion, id: "new-version" },
    });
  });

  it("creates backup and ATS Optimized versions", async () => {
    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(true);
    expect(mockCreateVersion).toHaveBeenCalledTimes(2);
    expect(mockCreateVersion).toHaveBeenNthCalledWith(
      1,
      "resume-123",
      mockCurrentSnapshot,
      { label: "Before ATS Optimization" },
    );
    expect(mockCreateVersion).toHaveBeenNthCalledWith(
      2,
      "resume-123",
      mockSnapshot,
      { label: "ATS Optimized" },
    );
  });

  it("returns resumeId on success", async () => {
    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resumeId).toBe("resume-123");
    }
  });

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Not authenticated"));

    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("signed in");
    }
  });

  it("returns error when resume not found", async () => {
    mockGetResume.mockResolvedValue({
      success: false,
      error: { code: "resume_not_found", message: "Not found" },
    });

    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("not found");
    }
  });

  it("returns error when no versions exist", async () => {
    mockListVersions.mockResolvedValue({ success: true, data: [] });

    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("no versions");
    }
  });

  it("returns error when backup creation fails", async () => {
    mockCreateVersion
      .mockResolvedValueOnce({
        success: false,
        error: { code: "unexpected", message: "Failed" },
      });

    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("backup");
    }
    expect(mockCreateVersion).toHaveBeenCalledTimes(1);
  });

  it("returns error when apply creation fails", async () => {
    mockCreateVersion
      .mockResolvedValueOnce({
        success: true,
        data: { ...mockVersion, id: "backup-version" },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { code: "unexpected", message: "Failed" },
      });

    const result = await applyToExistingResumeAction(
      "resume-123",
      mockSnapshot,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("apply");
    }
  });

  it("revalidates paths on success", async () => {
    await applyToExistingResumeAction("resume-123", mockSnapshot);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/resumes/resume-123/edit",
    );
  });

  it("does not revalidate on failure", async () => {
    mockCreateVersion.mockResolvedValue({
      success: false,
      error: { code: "unexpected", message: "Failed" },
    });

    await applyToExistingResumeAction("resume-123", mockSnapshot);

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
