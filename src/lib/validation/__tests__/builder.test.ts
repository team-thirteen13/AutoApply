import { describe, it, expect } from "vitest";
import {
  personalInfoSchema,
  summarySchema,
  experienceEntrySchema,
  educationEntrySchema,
  skillEntrySchema,
  projectEntrySchema,
  certificationEntrySchema,
  languageEntrySchema,
  resumeSnapshotSchema,
  validateSection,
  findFirstInvalidSection,
} from "../builder";

// ── Personal Info Schema ─────────────────────────────────

describe("personalInfoSchema", () => {
  it("accepts valid personal info with required fields", () => {
    const result = personalInfoSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts personal info with all fields", () => {
    const result = personalInfoSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      title: "Software Engineer",
      phone: "+1 234 567 890",
      city: "San Francisco",
      country: "USA",
      address: "123 Main St",
      location: "San Francisco, USA",
      tagline: "Senior Developer",
      bio: "Experienced developer",
      githubUrl: "https://github.com/johndoe",
      linkedinUrl: "https://linkedin.com/in/johndoe",
      portfolioUrl: "https://johndoe.dev",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const result = personalInfoSchema.safeParse({
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when email is missing", () => {
    const result = personalInfoSchema.safeParse({
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = personalInfoSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = personalInfoSchema.safeParse({
      name: "  ",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });
});

// ── Summary Schema ───────────────────────────────────────

describe("summarySchema", () => {
  it("accepts empty summary", () => {
    const result = summarySchema.safeParse({ summary: "" });
    expect(result.success).toBe(true);
  });

  it("accepts valid summary", () => {
    const result = summarySchema.safeParse({
      summary: "Experienced software engineer with 5+ years of experience.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing summary", () => {
    const result = summarySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ── Experience Entry Schema ──────────────────────────────

describe("experienceEntrySchema", () => {
  it("accepts valid experience entry", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
      startDate: "2020-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when company is missing", () => {
    const result = experienceEntrySchema.safeParse({
      title: "Software Engineer",
      startDate: "2020-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when title is missing", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      startDate: "2020-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when startDate is missing", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
      startDate: "2020/01/15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects endDate before startDate", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
      startDate: "2020-01-15",
      endDate: "2019-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects endDate when isCurrent is true", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
      startDate: "2020-01-15",
      endDate: "2024-01-15",
      isCurrent: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null endDate when isCurrent is true", () => {
    const result = experienceEntrySchema.safeParse({
      company: "Acme Inc.",
      title: "Software Engineer",
      startDate: "2020-01-15",
      endDate: null,
      isCurrent: true,
    });
    expect(result.success).toBe(true);
  });
});

// ── Education Entry Schema ───────────────────────────────

describe("educationEntrySchema", () => {
  it("accepts valid education entry", () => {
    const result = educationEntrySchema.safeParse({
      university: "MIT",
      degree: "BS Computer Science",
      startDate: "2016-09-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when university is missing", () => {
    const result = educationEntrySchema.safeParse({
      degree: "BS Computer Science",
      startDate: "2016-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when degree is missing", () => {
    const result = educationEntrySchema.safeParse({
      university: "MIT",
      startDate: "2016-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects endDate before startDate", () => {
    const result = educationEntrySchema.safeParse({
      university: "MIT",
      degree: "BS Computer Science",
      startDate: "2020-09-01",
      endDate: "2019-06-01",
    });
    expect(result.success).toBe(false);
  });
});

// ── Skills Entry Schema ──────────────────────────────────

describe("skillEntrySchema", () => {
  it("accepts valid skill entry", () => {
    const result = skillEntrySchema.safeParse({
      name: "JavaScript",
    });
    expect(result.success).toBe(true);
  });

  it("accepts skill with category and proficiency", () => {
    const result = skillEntrySchema.safeParse({
      name: "JavaScript",
      category: "technical",
      proficiency: "advanced",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const result = skillEntrySchema.safeParse({
      category: "technical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = skillEntrySchema.safeParse({
      name: "  ",
    });
    expect(result.success).toBe(false);
  });
});

// ── Projects Entry Schema ────────────────────────────────

describe("projectEntrySchema", () => {
  it("accepts valid project entry", () => {
    const result = projectEntrySchema.safeParse({
      title: "AutoApply",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when title is missing", () => {
    const result = projectEntrySchema.safeParse({
      description: "AI resume builder",
    });
    expect(result.success).toBe(false);
  });
});

// ── Certifications Entry Schema ──────────────────────────

describe("certificationEntrySchema", () => {
  it("accepts valid certification entry", () => {
    const result = certificationEntrySchema.safeParse({
      name: "AWS Solutions Architect",
      startDate: "2023-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const result = certificationEntrySchema.safeParse({
      startDate: "2023-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when startDate is missing", () => {
    const result = certificationEntrySchema.safeParse({
      name: "AWS Solutions Architect",
    });
    expect(result.success).toBe(false);
  });

  it("accepts doesNotExpire without endDate", () => {
    const result = certificationEntrySchema.safeParse({
      name: "AWS Solutions Architect",
      startDate: "2023-01-15",
      doesNotExpire: true,
    });
    expect(result.success).toBe(true);
  });
});

// ── Languages Entry Schema ───────────────────────────────

describe("languageEntrySchema", () => {
  it("accepts valid language entry", () => {
    const result = languageEntrySchema.safeParse({
      name: "English",
    });
    expect(result.success).toBe(true);
  });

  it("accepts language with proficiency", () => {
    const result = languageEntrySchema.safeParse({
      name: "English",
      proficiency: "native",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when name is missing", () => {
    const result = languageEntrySchema.safeParse({
      proficiency: "native",
    });
    expect(result.success).toBe(false);
  });
});

// ── Full Snapshot Schema ─────────────────────────────────

describe("resumeSnapshotSchema", () => {
  it("accepts empty snapshot", () => {
    const result = resumeSnapshotSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts snapshot with all sections", () => {
    const result = resumeSnapshotSchema.safeParse({
      profile: { name: "John Doe", email: "john@example.com" },
      summary: "Experienced developer",
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "2020-01-15",
        },
      ],
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "2016-09-01",
        },
      ],
      skills: [{ name: "JavaScript" }],
      projects: [{ title: "AutoApply" }],
      certificates: [{ name: "AWS", startDate: "2023-01-15" }],
      languages: [{ name: "English" }],
    });
    expect(result.success).toBe(true);
  });
});

// ── validateSection Helper ───────────────────────────────

describe("validateSection", () => {
  it("returns valid for valid personal info", () => {
    const result = validateSection("personal", {
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("returns errors for invalid personal info", () => {
    const result = validateSection("personal", {});
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.email).toBeTruthy();
  });

  it("returns valid for empty experience array", () => {
    const result = validateSection("experience", []);
    expect(result.valid).toBe(true);
  });

  it("returns errors for invalid experience entries", () => {
    const result = validateSection("experience", [
      { company: "Acme" }, // missing title and startDate
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors["0.title"]).toBeTruthy();
    expect(result.errors["0.startDate"]).toBeTruthy();
  });
});

// ── findFirstInvalidSection Helper ───────────────────────

describe("findFirstInvalidSection", () => {
  it("returns null for valid snapshot", () => {
    const result = findFirstInvalidSection({
      profile: { name: "John", email: "john@example.com" },
    });
    expect(result).toBeNull();
  });

  it("returns personal for snapshot missing name", () => {
    const result = findFirstInvalidSection({
      profile: { email: "john@example.com" },
    });
    expect(result).toBe("personal");
  });

  it("returns personal for snapshot missing email", () => {
    const result = findFirstInvalidSection({
      profile: { name: "John" },
    });
    expect(result).toBe("personal");
  });

  it("returns experience for invalid experience entries", () => {
    const result = findFirstInvalidSection({
      profile: { name: "John", email: "john@example.com" },
      experiences: [{ company: "Acme" }], // missing title
    });
    expect(result).toBe("experience");
  });
});
