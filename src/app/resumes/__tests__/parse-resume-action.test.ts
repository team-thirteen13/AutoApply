import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

// ── Mock supabase server (prevents env validation) ──────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({})),
}));

// ── Mock auth ───────────────────────────────────────────────

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

// ── Mock parser ─────────────────────────────────────────────

const mockParseResume = vi.fn();
vi.mock("@/features/resume-parser", () => ({
  parseResume: (...args: unknown[]) => mockParseResume(...args),
}));

import { parseResumeFileAction } from "../actions";

const FIXTURES = join(
  __dirname,
  "../../../features/resume-parser/__tests__/fixtures",
);

const AUTH_USER = {
  id: "user-123",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-01T00:00:00Z",
};

function makeFile(
  name: string,
  type: string,
  size: number,
): File {
  const buffer = Buffer.alloc(size, "x");
  return new File([buffer], name, { type });
}

function makePdfFixtureFile(name = "resume.pdf"): File {
  const data = readFileSync(join(FIXTURES, "valid.pdf"));
  return new File([data], name, { type: "application/pdf" });
}

function makeDocxFixtureFile(name = "resume.docx"): File {
  const data = readFileSync(join(FIXTURES, "valid.docx"));
  return new File([data], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function makeMalformedPdfFile(): File {
  const data = readFileSync(join(FIXTURES, "malformed.pdf"));
  return new File([data], "bad.pdf", { type: "application/pdf" });
}

function makeMalformedDocxFile(): File {
  const data = readFileSync(join(FIXTURES, "malformed.docx"));
  return new File([data], "bad.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

const SNAPSHOT = {
  profile: { name: "Alex Example", email: "alex@example.test" },
  summary: "Software engineer",
};

describe("parseResumeFileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(AUTH_USER);
    mockParseResume.mockResolvedValue({
      success: true,
      data: SNAPSHOT,
      warnings: [],
    });
  });

  // ── Authentication ──────────────────────────────────────

  it("rejects unauthenticated request", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const file = makePdfFixtureFile();
    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("authentication_required");
      expect(result.error).toContain("signed in");
    }
  });

  it("does not invoke parser when unauthenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const file = makePdfFixtureFile();
    await parseResumeFileAction(file);

    expect(mockParseResume).not.toHaveBeenCalled();
  });

  it("authenticates before any validation", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    // Even an unsupported type should hit auth first
    const file = makeFile("test.png", "image/png", 100);
    await parseResumeFileAction(file);

    expect(mockRequireAuthenticatedUser).toHaveBeenCalled();
    expect(mockParseResume).not.toHaveBeenCalled();
  });

  // ── Authenticated PDF parsing ───────────────────────────

  it("parses authenticated valid PDF", async () => {
    const file = makePdfFixtureFile();
    mockParseResume.mockResolvedValue({
      success: true,
      data: SNAPSHOT,
      warnings: [],
    });

    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(true);
    expect(mockRequireAuthenticatedUser).toHaveBeenCalled();
    expect(mockParseResume).toHaveBeenCalledWith(
      expect.any(Buffer),
      "application/pdf",
    );
  });

  it("parses authenticated valid DOCX", async () => {
    const file = makeDocxFixtureFile();
    mockParseResume.mockResolvedValue({
      success: true,
      data: SNAPSHOT,
      warnings: [],
    });

    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(true);
    expect(mockParseResume).toHaveBeenCalledWith(
      expect.any(Buffer),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  // ── Oversized files ─────────────────────────────────────

  it("rejects oversized PDF with file_too_large", async () => {
    const file = makeFile("big.pdf", "application/pdf", 11 * 1024 * 1024);
    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("file_too_large");
      expect(result.error).toContain("10 MB");
    }
    expect(mockParseResume).not.toHaveBeenCalled();
  });

  it("rejects oversized DOCX with file_too_large", async () => {
    const file = makeFile(
      "big.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      11 * 1024 * 1024,
    );
    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("file_too_large");
      expect(result.error).toContain("10 MB");
    }
    expect(mockParseResume).not.toHaveBeenCalled();
  });

  // ── Unsupported types ───────────────────────────────────

  it("rejects unsupported MIME type with unsupported_file_type", async () => {
    const file = makeFile("image.png", "image/png", 100);
    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("unsupported_file_type");
    }
    expect(mockParseResume).not.toHaveBeenCalled();
  });

  // ── Malformed files ─────────────────────────────────────

  it("returns safe error for malformed authenticated PDF", async () => {
    const file = makeMalformedPdfFile();
    mockParseResume.mockResolvedValue({
      success: false,
      error: {
        code: "malformed_document",
        message: "Could not read this PDF file. The file may be corrupted or password-protected.",
      },
    });

    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("malformed_document");
      expect(result.error).toContain("corrupted");
    }
  });

  it("returns safe error for malformed authenticated DOCX", async () => {
    const file = makeMalformedDocxFile();
    mockParseResume.mockResolvedValue({
      success: false,
      error: {
        code: "malformed_document",
        message: "Could not read this DOCX file. The file may be corrupted.",
      },
    });

    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("malformed_document");
      expect(result.error).toContain("corrupted");
    }
  });

  // ── Empty files ─────────────────────────────────────────

  it("rejects empty file", async () => {
    const file = makeFile("empty.pdf", "application/pdf", 0);
    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("empty_document");
    }
    expect(mockParseResume).not.toHaveBeenCalled();
  });

  // ── Parser warnings ─────────────────────────────────────

  it("includes parser warnings in result", async () => {
    const file = makePdfFixtureFile();
    mockParseResume.mockResolvedValue({
      success: true,
      data: SNAPSHOT,
      warnings: ["Some formatting was lost"],
    });

    const result = await parseResumeFileAction(file);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toContain("Some formatting was lost");
    }
  });
});
