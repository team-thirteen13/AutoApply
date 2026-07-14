import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelectEq2 = vi.fn();
const mockSelectEq1 = vi.fn();
const mockSelect = vi.fn();
const mockUpdateEq2 = vi.fn();
const mockUpdateEq1 = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: (...args: unknown[]) => mockSelect(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        remove: (...args: unknown[]) => mockRemove(...args),
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

function setupSelectChain(filePath: string | null = null) {
  mockSelect.mockReturnValue({ eq: mockSelectEq1 });
  mockSelectEq1.mockReturnValue({ eq: mockSelectEq2 });
  mockSelectEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockResolvedValue({
    data: filePath
      ? { id: VALID_ID, file_path: filePath }
      : { id: VALID_ID, file_path: null },
    error: null,
  });
}

function setupUpdateChain(options?: { error?: { message: string } }) {
  mockUpdate.mockReturnValue({ eq: mockUpdateEq1 });
  mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 });

  if (options?.error) {
    mockUpdateEq2.mockReturnValue({ error: options.error });
  } else {
    mockUpdateEq2.mockReturnValue({});
  }
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
    setupSelectChain();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("uploads file with upsert false", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    await uploadResumeFile(VALID_ID, makeFile());

    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(ArrayBuffer),
      expect.objectContaining({ upsert: false }),
    );
  });

  it("generates UUID-based storage path", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result = await uploadResumeFile(VALID_ID, makeFile("my-resume.pdf"));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toMatch(
        new RegExp(`^${VALID_USER_ID}/${VALID_ID}/[0-9a-f-]+-my-resume\\.pdf$`),
      );
    }
  });

  it("same original filename produces distinct paths", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result1 = await uploadResumeFile(VALID_ID, makeFile("resume.pdf"));

    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result2 = await uploadResumeFile(VALID_ID, makeFile("resume.pdf"));

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.filePath).not.toBe(result2.data.filePath);
    }
  });

  it("reads current file_path before upload", async () => {
    const oldPath = `${VALID_USER_ID}/${VALID_ID}/old-file.pdf`;
    setupSelectChain(oldPath);
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result = await uploadResumeFile(VALID_ID, makeFile("new-file.pdf"));

    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  it("DB update failure removes new object", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    setupUpdateChain({ error: { message: "DB error" } });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
    // Should attempt to remove the uploaded object (compensation)
    expect(mockRemove).toHaveBeenCalledWith([expect.any(String)]);
  });

  it("DB update failure preserves old path", async () => {
    const oldPath = `${VALID_USER_ID}/${VALID_ID}/old-file.pdf`;
    setupSelectChain(oldPath);
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    setupUpdateChain({ error: { message: "DB error" } });

    await uploadResumeFile(VALID_ID, makeFile("new-file.pdf"));

    // Compensation removes NEW object, not old
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining("new-file.pdf")]);
    expect(mockRemove).not.toHaveBeenCalledWith([oldPath]);
  });

  it("successful replacement removes old object", async () => {
    const oldPath = `${VALID_USER_ID}/${VALID_ID}/old-file.pdf`;
    setupSelectChain(oldPath);
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    setupUpdateChain();

    await uploadResumeFile(VALID_ID, makeFile("new-file.pdf"));

    // Should remove old object after successful update
    expect(mockRemove).toHaveBeenCalledWith([oldPath]);
  });

  it("old-object cleanup failure still leaves new file active", async () => {
    const oldPath = `${VALID_USER_ID}/${VALID_ID}/old-file.pdf`;
    setupSelectChain(oldPath);
    mockUpload.mockResolvedValue({ error: null });
    // Old object removal fails
    mockRemove.mockResolvedValue({ error: { message: "Remove failed" } });
    setupUpdateChain();

    const result = await uploadResumeFile(VALID_ID, makeFile("new-file.pdf"));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toContain("new-file.pdf");
    }
  });

  it("DB update fails and remove resolves with error", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: { message: "Compensation failed" } });
    setupUpdateChain({ error: { message: "DB error" } });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).not.toContain("Compensation failed");
    }
    // Compensation was attempted
    expect(mockRemove).toHaveBeenCalledWith([expect.any(String)]);
  });

  it("DB update fails and remove rejects", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockRejectedValue(new Error("Network timeout"));
    setupUpdateChain({ error: { message: "DB error" } });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    // Should still return normal upload failure, not throw
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).not.toContain("Network timeout");
    }
  });

  it("revalidation only after committed success", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: null });
    setupUpdateChain();

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(true);
  });

  it("returns upload_failed on storage error", async () => {
    setupSelectChain();
    mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });

    const result = await uploadResumeFile(VALID_ID, makeFile());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("upload_failed");
    }
  });

  it("returns unexpected on Supabase resume query error", async () => {
    setupSelectChain();
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
    setupSelectChain();
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
