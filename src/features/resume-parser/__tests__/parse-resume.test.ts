import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock the parsers
const mockPdfParse = vi.fn();
const mockDocxParse = vi.fn();

vi.mock("../pdf-parser", () => ({
  PdfResumeParser: class MockPdfResumeParser {
    parse = (...args: unknown[]) => mockPdfParse(...args);
  },
}));

vi.mock("../docx-parser", () => ({
  DocxResumeParser: class MockDocxResumeParser {
    parse = (...args: unknown[]) => mockDocxParse(...args);
  },
}));

import { parseResume } from "../parse-resume";

describe("parseResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses PDF files using PdfResumeParser", async () => {
    mockPdfParse.mockResolvedValue({
      success: true,
      data: {
        profile: { name: "Test User", email: "test@example.com" },
        summary: "Test summary",
      },
    });

    const buffer = Buffer.from("fake pdf");
    const result = await parseResume(buffer, "application/pdf");

    expect(result.success).toBe(true);
    expect(mockPdfParse).toHaveBeenCalled();
    if (result.success) {
      expect(result.data.profile?.name).toBe("Test User");
    }
  });

  it("parses DOCX files using DocxResumeParser", async () => {
    mockDocxParse.mockResolvedValue({
      success: true,
      data: {
        profile: { name: "Test User" },
        experiences: [
          {
            company: "Test Corp",
            title: "Developer",
            startDate: "2020-01",
          },
        ],
      },
    });

    const buffer = Buffer.from("fake docx");
    const result = await parseResume(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    expect(result.success).toBe(true);
    expect(mockDocxParse).toHaveBeenCalled();
    if (result.success) {
      expect(result.data.experiences).toBeDefined();
    }
  });

  it("returns unsupported_file_type for invalid MIME type", async () => {
    const buffer = Buffer.from("content");
    const result = await parseResume(buffer, "image/png");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unsupported_file_type");
      expect(result.error.message).toContain("PDF or DOCX");
    }
  });

  it("returns unsupported_file_type for text/plain", async () => {
    const buffer = Buffer.from("content");
    const result = await parseResume(buffer, "text/plain");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unsupported_file_type");
    }
  });

  it("propagates parser errors", async () => {
    mockPdfParse.mockResolvedValue({
      success: false,
      error: {
        code: "scanned_pdf",
        message: "This PDF appears to be scanned",
      },
    });

    const buffer = Buffer.from("fake pdf");
    const result = await parseResume(buffer, "application/pdf");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("scanned_pdf");
    }
  });

  it("normalizes parsed data to ResumeSnapshot format", async () => {
    mockDocxParse.mockResolvedValue({
      success: true,
      data: {
        profile: { name: "Test User" },
        skills: [
          { name: "JavaScript", category: "Technical", proficiency: "Proficient" },
        ],
        languages: [{ name: "English", proficiency: "Native" }],
      },
    });

    const buffer = Buffer.from("fake docx");
    const result = await parseResume(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify IDs are generated
      expect(result.data.skills?.[0].id).toBeDefined();
      expect(result.data.languages?.[0].id).toBeDefined();
    }
  });

  it("includes parser warnings in result", async () => {
    mockDocxParse.mockResolvedValue({
      success: true,
      data: {
        profile: { name: "Test User" },
        warnings: ["Some formatting was lost"],
      },
    });

    const buffer = Buffer.from("fake docx");
    const result = await parseResume(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings).toContain("Some formatting was lost");
    }
  });

  it("returns empty warnings when none present", async () => {
    mockPdfParse.mockResolvedValue({
      success: true,
      data: {
        profile: { name: "Test User" },
      },
    });

    const buffer = Buffer.from("fake pdf");
    const result = await parseResume(buffer, "application/pdf");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings).toEqual([]);
    }
  });
});
