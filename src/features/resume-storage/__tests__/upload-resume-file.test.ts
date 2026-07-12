import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockUpload = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
      })),
    },
  })),
}));

import { uploadResumeFile } from "../upload-resume-file";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function makeFile(name = "resume.pdf", size = 1024, type = "application/pdf") {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

function setupResumeChain() {
  const eq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ select });
}

function setupUpdateChain() {
  const eq2 = vi.fn().mockReturnValue({});
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const update = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ update });
}

describe("uploadResumeFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: VALID_USER_ID,
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await uploadResumeFile("not-a-uuid", makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns empty_file for zero-byte file", async () => {
    const file = makeFile("resume.pdf", 0);
    const result = await uploadResumeFile(VALID_ID, file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("empty_file");
    }
  });

  it("returns file_too_large for oversized file", async () => {
    const file = makeFile("resume.pdf", 11 * 1024 * 1024);
    const result = await uploadResumeFile(VALID_ID, file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("file_too_large");
    }
  });

  it("returns invalid_file_type for non-PDF/DOCX file", async () => {
    const file = new File(["test"], "resume.txt", { type: "text/plain" });
    const result = await uploadResumeFile(VALID_ID, file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("invalid_file_type");
    }
  });

  it("returns resume_not_found when resume does not exist", async () => {
    setupResumeChain();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("uploads file and updates resume record", async () => {
    setupResumeChain();
    mockMaybeSingle.mockResolvedValue({ data: { id: VALID_ID }, error: null });
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toContain(VALID_USER_ID);
      expect(result.data.filePath).toContain(VALID_ID);
      expect(result.data.contentType).toBe("application/pdf");
      expect(result.data.size).toBe(1024);
    }
  });

  it("returns upload_failed on storage error", async () => {
    setupResumeChain();
    mockMaybeSingle.mockResolvedValue({ data: { id: VALID_ID }, error: null });
    mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("upload_failed");
    }
  });

  it("returns unexpected on Supabase resume query error", async () => {
    setupResumeChain();
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("does not expose raw Supabase errors", async () => {
    setupResumeChain();
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "some_error", message: "Detailed DB error" },
    });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("DB error");
    }
  });
});
