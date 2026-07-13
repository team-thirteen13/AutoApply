import { describe, it, expect } from "vitest";
import { normalizeSkills, normalizeSnapshotSkills } from "../skills-normalize";

describe("normalizeSkills", () => {
  it("returns empty array for undefined input", () => {
    expect(normalizeSkills(undefined)).toEqual([]);
  });

  it("returns empty array for empty array", () => {
    expect(normalizeSkills([])).toEqual([]);
  });

  it("normalizes string array to object form", () => {
    const result = normalizeSkills(["JavaScript", "React", "TypeScript"]);
    expect(result).toEqual([
      { name: "JavaScript", category: "", proficiency: "" },
      { name: "React", category: "", proficiency: "" },
      { name: "TypeScript", category: "", proficiency: "" },
    ]);
  });

  it("normalizes object array with missing fields", () => {
    const result = normalizeSkills([
      { name: "JavaScript", category: "technical" },
      { name: "React" },
    ]);
    expect(result).toEqual([
      { name: "JavaScript", category: "technical", proficiency: "" },
      { name: "React", category: "", proficiency: "" },
    ]);
  });

  it("preserves complete object form", () => {
    const input = [
      { name: "JavaScript", category: "technical", proficiency: "advanced" },
      { name: "React", category: "technical", proficiency: "intermediate" },
    ];
    const result = normalizeSkills(input);
    expect(result).toEqual(input);
  });

  it("preserves id field when present", () => {
    const input = [
      { id: "123", name: "JavaScript", category: "technical", proficiency: "advanced" },
    ];
    const result = normalizeSkills(input);
    expect(result).toEqual([
      { id: "123", name: "JavaScript", category: "technical", proficiency: "advanced" },
    ]);
  });
});

describe("normalizeSnapshotSkills", () => {
  it("normalizes skills in a snapshot", () => {
    const snapshot = {
      skills: ["JavaScript", "React"],
    };
    const result = normalizeSnapshotSkills(snapshot);
    expect(result.skills).toEqual([
      { name: "JavaScript", category: "", proficiency: "" },
      { name: "React", category: "", proficiency: "" },
    ]);
  });

  it("handles snapshot without skills", () => {
    const snapshot = {
      skills: undefined,
    };
    const result = normalizeSnapshotSkills(snapshot);
    expect(result.skills).toBeUndefined();
  });

  it("returns new snapshot with normalized skills", () => {
    const snapshot = {
      skills: ["JavaScript"],
    };
    const result = normalizeSnapshotSkills(snapshot);
    expect(result).not.toBe(snapshot);
    expect(result.skills).toEqual([
      { name: "JavaScript", category: "", proficiency: "" },
    ]);
  });
});
