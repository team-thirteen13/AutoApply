import { describe, it, expect } from "vitest";
import { buildStoragePath, getStorageBucket } from "../resume-storage-path";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const RESUME_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("buildStoragePath", () => {
  it("builds correct path for PDF", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.pdf`);
  });

  it("builds correct path for DOCX", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume.docx");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.docx`);
  });

  it("normalizes spaces to hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "My Resume.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/my-resume.pdf`);
  });

  it("strips special characters", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume (final) v2.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume-final-v2.pdf`);
  });

  it("handles path traversal attempts", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "../../../etc/passwd.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/passwd.pdf`);
  });

  it("handles backslash path separators", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "C:\\Users\\resume.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.pdf`);
  });

  it("lowercases filename", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "RESUME.PDF");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.pdf`);
  });

  it("collapses multiple hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "a---b.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/a-b.pdf`);
  });

  it("strips leading/trailing hyphens", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "-resume-.pdf");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.pdf`);
  });

  it("handles file without extension", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "resume");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume`);
  });

  it("preserves .docx extension", () => {
    const path = buildStoragePath(USER_ID, RESUME_ID, "Resume.DOCX");
    expect(path).toBe(`${USER_ID}/${RESUME_ID}/resume.docx`);
  });
});

describe("getStorageBucket", () => {
  it("returns resume-files bucket", () => {
    expect(getStorageBucket()).toBe("resume-files");
  });
});
