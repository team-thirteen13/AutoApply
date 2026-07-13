import { describe, it, expect } from "vitest";
import { generateResumeSchema } from "../ai";

describe("generateResumeSchema", () => {
  it("accepts valid profile-only input", () => {
    const result = generateResumeSchema.safeParse({
      profile: { name: "Test" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid experiences-only input", () => {
    const result = generateResumeSchema.safeParse({
      experiences: [{ company: "Acme", title: "Dev", startDate: "2020-01" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid skills-only input", () => {
    const result = generateResumeSchema.safeParse({
      skills: ["TypeScript"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid targetRole-only input", () => {
    const result = generateResumeSchema.safeParse({
      targetRole: "Engineer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty input", () => {
    const result = generateResumeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty experiences array", () => {
    const result = generateResumeSchema.safeParse({
      experiences: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects experience without required fields", () => {
    const result = generateResumeSchema.safeParse({
      experiences: [{ company: "Acme" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects experience with empty company", () => {
    const result = generateResumeSchema.safeParse({
      experiences: [{ company: "", title: "Dev", startDate: "2020-01" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = generateResumeSchema.safeParse({
      profile: { name: "Test" },
      unknownField: "value",
    });
    expect(result.success).toBe(false);
  });

  it("accepts full valid input", () => {
    const result = generateResumeSchema.safeParse({
      profile: { name: "Test", title: "Engineer" },
      experiences: [
        {
          company: "Acme",
          title: "Dev",
          startDate: "2020-01",
          accomplishments: ["Built thing"],
          skills: ["TypeScript"],
        },
      ],
      education: [
        {
          university: "MIT",
          degree: "BS",
          startDate: "2016-09",
          endDate: "2020-05",
        },
      ],
      projects: [
        {
          title: "My Project",
          technologies: ["React"],
        },
      ],
      certificates: [
        {
          name: "AWS",
          startDate: "2022-01",
        },
      ],
      skills: ["TypeScript", "React"],
      targetRole: "Staff Engineer",
    });
    expect(result.success).toBe(true);
  });

  it("enforces array size limits", () => {
    const result = generateResumeSchema.safeParse({
      skills: Array(101).fill("skill"),
    });
    expect(result.success).toBe(false);
  });

  it("enforces experience array size limit", () => {
    const result = generateResumeSchema.safeParse({
      experiences: Array(51).fill({
        company: "Acme",
        title: "Dev",
        startDate: "2020-01",
      }),
    });
    expect(result.success).toBe(false);
  });
});
