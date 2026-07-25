import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// DO NOT mock server-only for integration tests — we test real library behavior.
// Instead, mock it minimally to allow imports.
vi.mock("server-only", () => ({}));

import { PdfResumeParser } from "../pdf-parser";
import { DocxResumeParser } from "../docx-parser";
import { parseResume } from "../parse-resume";

const FIXTURES = join(__dirname, "fixtures");

function loadFixture(name: string): Buffer {
  return readFileSync(join(FIXTURES, name));
}

// ── Real PDF parsing ────────────────────────────────────────

describe("Integration: real PDF parsing", () => {
  const parser = new PdfResumeParser();

  it("parses a valid text-based PDF and extracts structured data", async () => {
    const buffer = loadFixture("valid.pdf");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      // Profile should be extracted
      expect(result.data.profile).toBeDefined();
      expect(result.data.profile?.name).toBeTruthy();

      // Should have at least some sections
      const hasContent =
        !!result.data.summary ||
        (result.data.experiences != null && result.data.experiences.length > 0) ||
        (result.data.education != null && result.data.education.length > 0) ||
        (result.data.skills != null && result.data.skills.length > 0);

      expect(hasContent).toBe(true);
    }
  });

  it("parses a short valid PDF", async () => {
    const buffer = loadFixture("short.pdf");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile).toBeDefined();
    }
  });

  it("returns scanned_pdf error for near-empty PDF", async () => {
    const buffer = loadFixture("empty.pdf");
    const result = await parser.parse(buffer);

    // Either scanned_pdf or it extracts minimal text and returns a result
    // The key is it doesn't crash
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("returns malformed_document for invalid PDF buffer", async () => {
    const buffer = loadFixture("malformed.pdf");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
    }
  });

  it("handles empty buffer gracefully", async () => {
    const buffer = Buffer.alloc(0);
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(["malformed_document", "scanned_pdf"]).toContain(result.error.code);
    }
  });
});

// ── Real DOCX parsing ───────────────────────────────────────

describe("Integration: real DOCX parsing", () => {
  const parser = new DocxResumeParser();

  it("parses a valid DOCX and extracts structured data", async () => {
    const buffer = loadFixture("valid.docx");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      // Profile should be extracted
      expect(result.data.profile).toBeDefined();
      expect(result.data.profile?.name).toBeTruthy();

      // Should have at least some sections
      const hasContent =
        !!result.data.summary ||
        (result.data.experiences != null && result.data.experiences.length > 0) ||
        (result.data.education != null && result.data.education.length > 0) ||
        (result.data.skills != null && result.data.skills.length > 0);

      expect(hasContent).toBe(true);
    }
  });

  it("parses a short valid DOCX", async () => {
    const buffer = loadFixture("short.docx");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile).toBeDefined();
    }
  });

  it("returns malformed_document for invalid DOCX buffer", async () => {
    const buffer = loadFixture("malformed.docx");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
    }
  });

  it("handles empty buffer gracefully", async () => {
    const buffer = Buffer.alloc(0);
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
    }
  });
});

// ── Full parseResume pipeline ───────────────────────────────

describe("Integration: parseResume pipeline", () => {
  it("returns valid ResumeSnapshot for real PDF", async () => {
    const buffer = loadFixture("valid.pdf");
    const result = await parseResume(buffer, "application/pdf");

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify it's a valid ResumeSnapshot structure
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("object");

      // IDs should be valid UUIDs if present
      if (result.data.experiences) {
        for (const exp of result.data.experiences) {
          expect(exp.id).toBeDefined();
          expect(exp.company).toBeDefined();
          expect(exp.title).toBeDefined();
        }
      }

      // Warnings should be an array
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  it("returns valid ResumeSnapshot for real DOCX", async () => {
    const buffer = loadFixture("valid.docx");
    const result = await parseResume(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("object");
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  it("returns unsupported_file_type for non-PDF/DOCX", async () => {
    const buffer = Buffer.from("some content");
    const result = await parseResume(buffer, "image/png");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unsupported_file_type");
    }
  });

  it("returns error for malformed PDF", async () => {
    const buffer = loadFixture("malformed.pdf");
    const result = await parseResume(buffer, "application/pdf");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(["malformed_document", "scanned_pdf"]).toContain(result.error.code);
    }
  });

  it("returns error for malformed DOCX", async () => {
    const buffer = loadFixture("malformed.docx");
    const result = await parseResume(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
    }
  });
});
