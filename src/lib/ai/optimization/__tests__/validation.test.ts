import { describe, it, expect } from "vitest";
import { validateProviderOutput } from "../validation";

describe("validateProviderOutput", () => {
  const validSnapshot = {
    profile: { name: "Test User" },
    summary: "Engineer",
    experiences: [
      {
        company: "TechCorp",
        title: "Engineer",
        startDate: "2020-01",
      },
    ],
    skills: [{ name: "TypeScript", category: "Languages", proficiency: "Expert" }],
  };

  it("accepts valid complete result", () => {
    const result = validateProviderOutput({
      optimizedResume: validSnapshot,
      changes: [],
      warnings: [],
    });
    expect(result.valid).toBe(true);
  });

  it("accepts result without optional fields", () => {
    const result = validateProviderOutput({
      optimizedResume: validSnapshot,
    });
    expect(result.valid).toBe(true);
  });

  describe("envelope validation", () => {
    it("rejects null", () => {
      const result = validateProviderOutput(null);
      expect(result.valid).toBe(false);
    });

    it("rejects string", () => {
      const result = validateProviderOutput("not an object");
      expect(result.valid).toBe(false);
    });

    it("rejects missing optimizedResume", () => {
      const result = validateProviderOutput({ changes: [], warnings: [] });
      expect(result.valid).toBe(false);
    });

    it("rejects optimizedResume as string", () => {
      const result = validateProviderOutput({
        optimizedResume: "not a resume",
      });
      expect(result.valid).toBe(false);
    });

    it("rejects unexpected top-level properties", () => {
      const result = validateProviderOutput({
        optimizedResume: validSnapshot,
        evil: true,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("profile validation", () => {
    it("accepts profile as undefined (optional)", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          profile: undefined,
        },
      });
      expect(result.valid).toBe(true);
    });

    it("rejects profile with numeric name", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          profile: { name: 123 },
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects profile with unexpected properties", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          profile: { name: "Test", evil: true },
        },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("experience validation", () => {
    it("rejects experiences as object", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: { company: "Test" },
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects experience with numeric company", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: [{ company: 123, title: "Engineer", startDate: "2020-01" }],
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects experience missing company", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: [{ title: "Engineer", startDate: "2020-01" }],
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects experience with empty company", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: [{ company: "", title: "Engineer", startDate: "2020-01" }],
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects experience with unexpected properties", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: [
            { company: "Test", title: "Eng", startDate: "2020-01", evil: true },
          ],
        },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("skills validation", () => {
    it("rejects malformed skill", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          skills: [{ name: "TypeScript" }], // missing category and proficiency
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects skill with numeric name", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          skills: [{ name: 123, category: "Lang", proficiency: "Expert" }],
        },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("language validation", () => {
    it("rejects malformed language", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          languages: [{ proficiency: "Native" }], // missing name
        },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("oversized output", () => {
    it("rejects excessively long string", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          summary: "x".repeat(10000),
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects excessively large array", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: Array.from({ length: 200 }, (_, i) => ({
            company: `Company ${i}`,
            title: "Engineer",
            startDate: "2020-01",
          })),
        },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects excessively long bullet", () => {
      const result = validateProviderOutput({
        optimizedResume: {
          ...validSnapshot,
          experiences: [
            {
              company: "Test",
              title: "Engineer",
              startDate: "2020-01",
              accomplishments: ["x".repeat(2000)],
            },
          ],
        },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("change metadata", () => {
    it("rejects change with invalid reason", () => {
      const result = validateProviderOutput({
        optimizedResume: validSnapshot,
        changes: [
          {
            section: "summary",
            field: "summary",
            originalValue: "Old",
            optimizedValue: "New",
            reason: "invalid_reason",
          },
        ],
      });
      expect(result.valid).toBe(false);
    });

    it("accepts valid change", () => {
      const result = validateProviderOutput({
        optimizedResume: validSnapshot,
        changes: [
          {
            section: "summary",
            field: "summary",
            originalValue: "Old",
            optimizedValue: "New",
            reason: "conciseness",
          },
        ],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("prototype pollution", () => {
    it("rejects object with non-Object prototype", () => {
      const arr = [1, 2, 3];
      const result = validateProviderOutput({
        optimizedResume: arr,
      });
      expect(result.valid).toBe(false);
    });
  });
});
