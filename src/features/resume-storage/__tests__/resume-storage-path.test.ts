import { describe, it, expect } from "vitest";
import { buildStoragePath, getStorageBucket, extractDisplayFileName } from "../resume-storage-path";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const RESUME_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("buildStoragePath", () => {
  it("builds path with UUID prefix", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.pdf");
    expect(path).toMatch(
      new RegExp(`^${USER_ID}/${RESUME_ID}/[0-9a-f-]+-resume\\.pdf$`),
    );
  });

  it("builds correct path for PDF", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.pdf");
    expect(path).toContain(`${USER_ID}/${RESUME_ID}/`);
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("builds correct path for DOCX", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.docx");
    expect(path).toContain(`${USER_ID}/${RESUME_ID}/`);
    expect(path).toMatch(/resume\.docx$/);
  });

  it("normalizes spaces to hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "My Resume.pdf");
    expect(path).toMatch(/my-resume\.pdf$/);
  });

  it("strips special characters", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume (final) v2.pdf");
    expect(path).toMatch(/resume-final-v2\.pdf$/);
  });

  it("handles path traversal attempts", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "../../../etc/passwd.pdf");
    expect(path).toMatch(/passwd\.pdf$/);
  });

  it("handles backslash path separators", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "C:\\Users\\resume.pdf");
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("lowercases filename", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "RESUME.PDF");
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("collapses multiple hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "a---b.pdf");
    expect(path).toMatch(/a-b\.pdf$/);
  });

  it("strips leading/trailing hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "-resume-.pdf");
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("handles file without extension", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume");
    expect(path).toMatch(/resume$/);
  });

  it("preserves .docx extension", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "Resume.DOCX");
    expect(path).toMatch(/resume\.docx$/);
  });

  it("handles leading dot filename", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, ".hidden-resume.pdf");
    expect(path).toMatch(/hidden-resume\.pdf$/);
  });

  it("handles control characters", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume\x00\x1f.pdf");
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("handles Unicode-only filename", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "履歴書.pdf");
    // Unicode chars are stripped, fallback to resume
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("handles repeated spaces", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "my   resume.pdf");
    expect(path).toMatch(/my-resume\.pdf$/);
  });

  it("handles empty stem fallback", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "....pdf");
    expect(path).toMatch(/resume\.pdf$/);
  });

  it("handles multiple extensions", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.final.v2.pdf");
    // Only the last extension is preserved
    expect(path).toMatch(/resume-final-v2\.pdf$/);
  });

  it("generates unique paths for same filename", () => {
    const path1 = buildStoragePath(USER_ID, RESUME_ID, "resume.pdf");
    const path2 = buildStoragePath(USER_ID, RESUME_ID, "resume.pdf");
    expect(path1).not.toBe(path2);
  });
});

describe("extractDisplayFileName", () => {
  it("removes UUID prefix from path", () => {
    const path = `${USER_ID}/${RESUME_ID}/550e8400-e29b-41d4-a716-446655440000-resume.pdf`;
    expect(extractDisplayFileName(path)).toBe("resume.pdf");
  });

  it("preserves filenames with normal hyphens", () => {
    const path = `${USER_ID}/${RESUME_ID}/550e8400-e29b-41d4-a716-446655440000-my-resume.pdf`;
    expect(extractDisplayFileName(path)).toBe("my-resume.pdf");
  });

  it("preserves .pdf extension", () => {
    const path = `${USER_ID}/${RESUME_ID}/550e8400-e29b-41d4-a716-446655440000-resume.pdf`;
    expect(extractDisplayFileName(path)).toMatch(/\.pdf$/);
  });

  it("preserves .docx extension", () => {
    const path = `${USER_ID}/${RESUME_ID}/550e8400-e29b-41d4-a716-446655440000-resume.docx`;
    expect(extractDisplayFileName(path)).toMatch(/\.docx$/);
  });

  it("handles malformed legacy paths", () => {
    const path = `${USER_ID}/${RESUME_ID}/resume.pdf`;
    expect(extractDisplayFileName(path)).toBe("resume.pdf");
  });

  it("handles paths without UUID prefix", () => {
    const path = "resume.pdf";
    expect(extractDisplayFileName(path)).toBe("resume.pdf");
  });

  it("handles paths with backslashes", () => {
    const path = `${USER_ID}\\${RESUME_ID}\\550e8400-e29b-41d4-a716-446655440000-resume.pdf`;
    expect(extractDisplayFileName(path)).toBe("resume.pdf");
  });

  it("handles empty path", () => {
    expect(extractDisplayFileName("")).toBe("");
  });
});

describe("getStorageBucket", () => {
  it("returns resume-files bucket", () => {
    expect(getStorageBucket()).toBe("resume-files");
  });
});
