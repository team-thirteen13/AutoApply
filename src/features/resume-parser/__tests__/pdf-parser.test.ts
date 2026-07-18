import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock pdf-parse
const mockGetText = vi.fn();
vi.mock("pdf-parse", () => ({
  PDFParse: class MockPDFParse {
    getText = (...args: unknown[]) => mockGetText(...args);
  },
}));

import { PdfResumeParser } from "../pdf-parser";

describe("PdfResumeParser", () => {
  let parser: PdfResumeParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new PdfResumeParser();
  });

  it("parses a text-based PDF successfully", async () => {
    mockGetText.mockResolvedValue({
      text: `John Doe
john@example.com

EXPERIENCE
Software Engineer at Google
January 2020 - Present
• Built great things`,
    });

    const buffer = Buffer.from("fake pdf content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile?.name).toBe("John Doe");
      expect(result.data.profile?.email).toBe("john@example.com");
      expect(result.data.experiences).toBeDefined();
    }
  });

  it("returns scanned_pdf error for image-only PDF", async () => {
    mockGetText.mockResolvedValue({
      text: "",
    });

    const buffer = Buffer.from("fake pdf content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("scanned_pdf");
      expect(result.error.message).toContain("scanned");
    }
  });

  it("returns scanned_pdf error for very short text", async () => {
    mockGetText.mockResolvedValue({
      text: "Hi",
    });

    const buffer = Buffer.from("fake pdf content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("scanned_pdf");
    }
  });

  it("returns malformed_document on parse error", async () => {
    mockGetText.mockRejectedValue(new Error("Invalid PDF"));

    const buffer = Buffer.from("fake pdf content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
      expect(result.error.message).toContain("corrupted");
    }
  });

  it("handles PDF with mixed content", async () => {
    mockGetText.mockResolvedValue({
      text: `JANE SMITH
jane.smith@email.com
+1 555-987-6543

PROFESSIONAL SUMMARY
Creative designer with 8 years of experience.

EXPERIENCE
Senior Designer at Apple
March 2018 - Present
• Led design system overhaul
• Mentored 5 junior designers

EDUCATION
Bachelor of Fine Arts at RISD
2014 - 2018

SKILLS
Figma, Sketch, Adobe XD, Photoshop

LANGUAGES
English - Native
Japanese - Intermediate`,
    });

    const buffer = Buffer.from("fake pdf content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile?.name).toBe("JANE SMITH");
      expect(result.data.summary).toContain("Creative designer");
      expect(result.data.experiences?.length).toBeGreaterThan(0);
      expect(result.data.education?.length).toBeGreaterThan(0);
      expect(result.data.skills?.length).toBeGreaterThan(0);
      expect(result.data.languages?.length).toBeGreaterThan(0);
    }
  });
});
