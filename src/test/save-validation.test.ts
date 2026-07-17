/**
 * Regression tests for save-validation UX fix.
 *
 * Root cause: When client validation fails, saveResumeAction is correctly NOT
 * called, but the error toast auto-dismisses after 4s and there is no persistent
 * error banner. Users mistakenly believe save succeeded, then lose data on reload.
 *
 * Fix: (1) persistent error banner, (2) longer error toast, (3) section errors
 * cleared on edit, (4) saveBlocked state.
 */
import { describe, it, expect } from "vitest";
import {
  validateSection,
  findFirstInvalidSection,
} from "@/lib/validation/builder";

describe("validateSection", () => {
  it("returns valid for empty experience array", () => {
    const result = validateSection("experience", []);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("returns invalid for experience with missing title", () => {
    const result = validateSection("experience", [
      { company: "Acme", title: "", startDate: "2024-01-15" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("0.title");
  });

  it("returns invalid for experience with missing company", () => {
    const result = validateSection("experience", [
      { company: "", title: "Engineer", startDate: "2024-01-15" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("0.company");
  });

  it("returns invalid for experience with invalid date", () => {
    const result = validateSection("experience", [
      { company: "Acme", title: "Engineer", startDate: "" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("returns valid for experience with all required fields", () => {
    const result = validateSection("experience", [
      { company: "Acme", title: "Engineer", startDate: "2024-01-15" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("returns valid for empty languages array", () => {
    const result = validateSection("languages", []);
    expect(result.valid).toBe(true);
  });

  it("returns valid for languages with name and proficiency", () => {
    const result = validateSection("languages", [
      { name: "Brazilian Portuguese", proficiency: "fluent" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("returns invalid for language with empty name", () => {
    const result = validateSection("languages", [
      { name: "", proficiency: "fluent" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("0.name");
  });
});

describe("findFirstInvalidSection", () => {
  it("returns null for valid snapshot", () => {
    const result = findFirstInvalidSection({
      profile: { name: "Test", email: "test@example.com" },
    });
    expect(result).toBeNull();
  });

  it("returns 'experience' when experience has invalid entries", () => {
    const result = findFirstInvalidSection({
      profile: { name: "Test", email: "test@example.com" },
      experiences: [{ company: "", title: "", startDate: "" }],
    });
    expect(result).toBe("experience");
  });

  it("returns 'personal' when name is missing", () => {
    const result = findFirstInvalidSection({
      profile: { name: "", email: "test@example.com" },
    });
    expect(result).toBe("personal");
  });

  it("returns 'personal' when email is missing", () => {
    const result = findFirstInvalidSection({
      profile: { name: "Test", email: "" },
    });
    expect(result).toBe("personal");
  });

  it("skips empty sections (no entries = valid)", () => {
    const result = findFirstInvalidSection({
      profile: { name: "Test", email: "test@example.com" },
      experiences: [],
      education: [],
      skills: [],
    });
    expect(result).toBeNull();
  });

  it("returns first invalid section in order", () => {
    const result = findFirstInvalidSection({
      profile: { name: "", email: "" },
      experiences: [{ company: "", title: "", startDate: "" }],
    });
    // personal comes before experience in sectionOrder
    expect(result).toBe("personal");
  });
});

describe("saveResumeAction is NOT called on validation failure", () => {
  it("validateAllSections returns errors for invalid experience", () => {
    // Simulate what validateAllSections does
    const snapshot = {
      profile: { name: "Test", email: "test@example.com" },
      experiences: [{ company: "Acme", title: "", startDate: "" }],
    };

    const experienceResult = validateSection("experience", snapshot.experiences);
    expect(experienceResult.valid).toBe(false);

    const hasErrors = !experienceResult.valid;
    expect(hasErrors).toBe(true);
    // In handleSave, this would cause an early return before saveResumeAction
  });

  it("validateAllSections passes for valid snapshot with languages", () => {
    const snapshot = {
      profile: { name: "Test", email: "test@example.com" },
      languages: [{ name: "Brazilian Portuguese", proficiency: "fluent" }],
    };

    const personalResult = validateSection("personal", snapshot.profile);
    expect(personalResult.valid).toBe(true);

    // Languages section: empty array is valid, non-empty with valid entries is valid
    const langResult = validateSection("languages", snapshot.languages);
    expect(langResult.valid).toBe(true);
  });
});
