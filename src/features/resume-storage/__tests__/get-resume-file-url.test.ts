import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockCreateSignedUrl = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  createSignedUrl: mockCreateSignedUrl,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: () => mockStorageFrom(),
    },
  })),
}));

import { getResumeFileUrl } from "../get-resume-file-url";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

function setupResumeChain(filePath: string | null) {
  const eq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ select });
  mockMaybeSingle.mockResolvedValue({
    data: filePath ? { id: VALID_ID, file_path: filePath } : { id: VALID_ID, file_path: null },
    error: null,
  });
}

describe("getResumeFileUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await getResumeFileUrl("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns resume_not_found when resume missing", async () => {
    setupResumeChain(null);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns not_found when no file uploaded", async () => {
    setupResumeChain(null);

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("not_found");
    }
  });

  it("generates signed URL for existing file", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example.com/resume.pdf" },
      error: null,
    });

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://signed.example.com/resume.pdf");
      expect(result.data.expiresAt).toBeGreaterThan(Date.now());
    }
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(filePath, 3600);
  });

  it("returns unexpected on signed URL error", async () => {
    setupResumeChain("user-123/resume-1/resume.pdf");
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "URL failed" },
    });

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("does not expose raw Supabase errors", async () => {
    setupResumeChain(null);
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Detailed DB error" },
    });

    const result = await getResumeFileUrl(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("DB error");
    }
  });
});
