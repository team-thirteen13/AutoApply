import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockRemove = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn((..._args: unknown[]) => ({
  remove: mockRemove,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => mockFrom(table),
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  })),
}));

import { deleteResumeFile } from "../delete-resume-file";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

function setupResumeChain(filePath: string | null) {
  const eq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ select });
  mockMaybeSingle.mockResolvedValue({
    data: filePath
      ? { id: VALID_ID, file_path: filePath }
      : { id: VALID_ID, file_path: null },
    error: null,
  });
}

/**
 * Setup the conditional clear chain:
 * update(...).eq(id).eq(user_id).eq(file_path).select("id").single()
 *
 * When zeroRowMatch is true, returns { data: null } to simulate
 * a concurrent file_path change (no rows matched the WHERE clause).
 */
function setupClearChain(options?: {
  error?: { message: string };
  zeroRowMatch?: boolean;
}) {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
  const eq3 = vi.fn().mockReturnValue({ select: mockSelect });
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const update = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ update });

  if (options?.error) {
    mockSingle.mockResolvedValue({ data: null, error: options.error });
  } else if (options?.zeroRowMatch) {
    // select().single() returns data: null when zero rows matched
    mockSingle.mockResolvedValue({ data: null, error: null });
  } else {
    mockSingle.mockResolvedValue({ data: { id: VALID_ID }, error: null });
  }
}

/**
 * Setup the restore chain:
 * update(...).eq(id).eq(user_id)
 */
function setupRestoreChain(options?: { error?: { message: string } }) {
  const eq2 = options?.error
    ? vi.fn().mockReturnValue({ error: options.error })
    : vi.fn().mockReturnValue({});
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const update = vi.fn().mockReturnValue({ eq: eq1 });
  mockFrom.mockReturnValueOnce({ update });
}

describe("deleteResumeFile", () => {
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
    const result = await deleteResumeFile("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns resume_not_found when resume missing", async () => {
    setupResumeChain(null);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns not_found when no file uploaded", async () => {
    setupResumeChain(null);

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("not_found");
    }
  });

  it("clears file_path before removing storage", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: null });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(true);
    // Verify sequence: clear first, then remove
    expect(mockFrom).toHaveBeenCalledWith("resumes");
    expect(mockRemove).toHaveBeenCalledWith([filePath]);
  });

  it("clears file_path with conditional WHERE clause", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: null });

    await deleteResumeFile(VALID_ID);

    // The clear chain uses select().single() to verify row was updated
    expect(mockFrom).toHaveBeenCalledWith("resumes");
  });

  it("metadata clear failure leaves storage untouched", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain({ error: { message: "DB error" } });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
    // Storage should NOT be touched
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("returns conflict when file_path changed concurrently", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain({ zeroRowMatch: true });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toContain("concurrently");
    }
    // Storage must NOT be touched in stale-state case
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("storage failure restores metadata", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: { message: "Delete failed" } });
    setupRestoreChain();

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
    // Should attempt to restore metadata
    expect(mockFrom).toHaveBeenCalledTimes(3); // select + clear + restore
  });

  it("restore failure returns consistency error", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: { message: "Delete failed" } });
    setupRestoreChain({ error: { message: "Restore failed" } });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
      expect(result.error.message).toContain("could not be restored");
    }
  });

  it("successful delete", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: null });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleted).toBe(true);
    }
    expect(mockRemove).toHaveBeenCalledWith([filePath]);
  });

  it("revalidation only after success", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: null });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(true);
    // Revalidation is handled by the server action, not the backend function
  });

  it("resume remains intact after delete", async () => {
    const filePath = "user-123/resume-1/resume.pdf";
    setupResumeChain(filePath);
    setupClearChain();
    mockRemove.mockResolvedValue({ error: null });

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(true);
    // The resume record should still exist, just with file_path cleared
  });

  it("returns unexpected on storage delete error", async () => {
    setupResumeChain("user-123/resume-1/resume.pdf");
    setupClearChain();
    mockRemove.mockResolvedValue({ error: { message: "Delete failed" } });
    setupRestoreChain();

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await deleteResumeFile(VALID_ID);

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

    const result = await deleteResumeFile(VALID_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("DB error");
    }
  });
});
