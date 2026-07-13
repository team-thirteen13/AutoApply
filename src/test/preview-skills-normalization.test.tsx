import { describe, it, expect } from "vitest";
import { normalizeSkills, normalizeSnapshotSkills } from "@/lib/skills-normalize";
import type { ResumeSnapshot } from "@/types/resume";

// ── Skills normalization for preview ─────────────────────

describe("skills normalization for preview", () => {
  describe("normalizeSkills", () => {
    it("converts legacy string-array skills to object form", () => {
      const result = normalizeSkills(["TypeScript", "React"]);
      expect(result).toEqual([
        { name: "TypeScript", category: "", proficiency: "" },
        { name: "React", category: "", proficiency: "" },
      ]);
    });

    it("preserves already-normalized object skills", () => {
      const input = [
        { name: "TypeScript", category: "technical", proficiency: "advanced" },
        { name: "React", category: "technical", proficiency: "intermediate" },
      ];
      const result = normalizeSkills(input);
      expect(result).toEqual(input);
    });

    it("normalizes object skills with missing optional fields", () => {
      const input = [
        { name: "TypeScript", category: "technical" },
        { name: "React" },
      ];
      const result = normalizeSkills(input);
      expect(result).toEqual([
        { name: "TypeScript", category: "technical", proficiency: "" },
        { name: "React", category: "", proficiency: "" },
      ]);
    });

    it("returns empty array for undefined input", () => {
      expect(normalizeSkills(undefined)).toEqual([]);
    });

    it("returns empty array for empty array", () => {
      expect(normalizeSkills([])).toEqual([]);
    });

    it("preserves id field when present", () => {
      const input = [{ id: "123", name: "TypeScript", category: "technical", proficiency: "advanced" }];
      const result = normalizeSkills(input);
      expect(result[0].id).toBe("123");
    });
  });

  describe("normalizeSnapshotSkills", () => {
    it("normalizes skills in a full snapshot", () => {
      const snapshot = {
        profile: { name: "John Doe", email: "john@example.com" },
        skills: ["TypeScript", "React"] as unknown as ResumeSnapshot["skills"],
        summary: "Experienced developer",
      };
      const result = normalizeSnapshotSkills(snapshot);
      expect(result.skills).toEqual([
        { name: "TypeScript", category: "", proficiency: "" },
        { name: "React", category: "", proficiency: "" },
      ]);
    });

    it("does not alter unrelated snapshot fields", () => {
      const snapshot = {
        profile: { name: "John Doe", email: "john@example.com" },
        summary: "Experienced developer",
        experiences: [{ company: "Acme", title: "Engineer", startDate: "2020-01-15" }],
        skills: ["TypeScript"] as unknown as ResumeSnapshot["skills"],
      };
      const result = normalizeSnapshotSkills(snapshot);
      expect(result.profile).toEqual(snapshot.profile);
      expect(result.summary).toBe(snapshot.summary);
      expect(result.experiences).toEqual(snapshot.experiences);
    });

    it("handles snapshot with undefined skills", () => {
      const snapshot: ResumeSnapshot = {
        profile: { name: "John Doe" },
      };
      const result = normalizeSnapshotSkills(snapshot);
      expect(result.skills).toBeUndefined();
    });

    it("handles empty skills array", () => {
      const snapshot: ResumeSnapshot = {
        skills: [],
      };
      const result = normalizeSnapshotSkills(snapshot);
      expect(result.skills).toEqual([]);
    });

    it("handles snapshot with already-normalized object skills", () => {
      const snapshot: ResumeSnapshot = {
        skills: [
          { name: "TypeScript", category: "technical", proficiency: "advanced" },
          { name: "React", category: "technical", proficiency: "intermediate" },
        ],
      };
      const result = normalizeSnapshotSkills(snapshot);
      expect(result.skills).toEqual([
        { name: "TypeScript", category: "technical", proficiency: "advanced" },
        { name: "React", category: "technical", proficiency: "intermediate" },
      ]);
    });
  });
});
