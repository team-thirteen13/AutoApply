import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock mammoth
const mockExtractRawText = vi.fn();
vi.mock("mammoth", () => ({
  default: {
    extractRawText: (...args: unknown[]) => mockExtractRawText(...args),
  },
}));

import { DocxResumeParser } from "../docx-parser";

describe("DocxResumeParser", () => {
  let parser: DocxResumeParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new DocxResumeParser();
  });

  it("parses a DOCX file successfully", async () => {
    mockExtractRawText.mockResolvedValue({
      value: `Bob Johnson
bob@example.com

EXPERIENCE
Developer at Microsoft
2019 - Present
• Built Azure features`,
      messages: [],
    });

    const buffer = Buffer.from("fake docx content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile?.name).toBe("Bob Johnson");
      expect(result.data.profile?.email).toBe("bob@example.com");
      expect(result.data.experiences).toBeDefined();
    }
  });

  it("returns empty_document error for empty content", async () => {
    mockExtractRawText.mockResolvedValue({
      value: "",
      messages: [],
    });

    const buffer = Buffer.from("fake docx content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("empty_document");
      expect(result.error.message).toContain("empty");
    }
  });

  it("returns malformed_document on parse error", async () => {
    mockExtractRawText.mockRejectedValue(new Error("Invalid DOCX"));

    const buffer = Buffer.from("fake docx content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("malformed_document");
      expect(result.error.message).toContain("corrupted");
    }
  });

  it("collects mammoth warnings", async () => {
    mockExtractRawText.mockResolvedValue({
      value: `Alice Brown
alice@example.com

SKILLS
JavaScript, TypeScript`,
      messages: [
        { type: "warning", message: "Some formatting was lost" },
      ],
    });

    const buffer = Buffer.from("fake docx content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toContain("Some formatting was lost");
    }
  });

  it("handles DOCX with all sections", async () => {
    mockExtractRawText.mockResolvedValue({
      value: `CHARLIE DAVIS
charlie@email.com
+1 555-111-2222
https://github.com/charliedavis

PROFESSIONAL SUMMARY
Full-stack developer passionate about clean code.

WORK EXPERIENCE
Senior Developer at Netflix
April 2020 - Present
• Optimized video streaming pipeline
• Reduced latency by 30%

Developer at Amazon
June 2017 - March 2020
• Developed recommendation engine

EDUCATION
Master of Computer Science at Stanford
2015 - 2017

Bachelor of Computer Science at UC Berkeley
2011 - 2015

TECHNICAL SKILLS
React, TypeScript, Python, Go, AWS, Docker

CERTIFICATIONS
AWS Solutions Architect Professional
Amazon Web Services
2021-06

PROJECTS
Open Source Contribution
Contributed to popular React libraries
Technologies: React, TypeScript

LANGUAGES
English - Native
Mandarin - Conversational`,
      messages: [],
    });

    const buffer = Buffer.from("fake docx content");
    const result = await parser.parse(buffer);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile?.name).toBe("CHARLIE DAVIS");
      expect(result.data.profile?.email).toBe("charlie@email.com");
      expect(result.data.summary).toContain("Full-stack developer");
      expect(result.data.experiences?.length).toBe(2);
      expect(result.data.education?.length).toBe(2);
      expect(result.data.skills?.length).toBeGreaterThan(0);
      expect(result.data.certificates?.length).toBe(1);
      expect(result.data.projects?.length).toBe(1);
      expect(result.data.languages?.length).toBe(2);
    }
  });
});
