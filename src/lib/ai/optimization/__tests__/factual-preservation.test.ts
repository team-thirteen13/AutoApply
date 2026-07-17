import { describe, it, expect } from "vitest";
import { validateFactualPreservation } from "../factual-preservation";
import type { ResumeSnapshot } from "@/types/resume";

const SOURCE_RESUME: ResumeSnapshot = {
  profile: {
    name: "John Doe",
    title: "Software Engineer",
    email: "john@example.com",
    phone: "+1-555-0100",
    city: "San Francisco",
    country: "US",
    githubUrl: "https://github.com/johndoe",
    linkedinUrl: "https://linkedin.com/in/johndoe",
  },
  summary: "A software engineer with 5 years of experience.",
  experiences: [
    {
      company: "TechCorp",
      title: "Senior Engineer",
      startDate: "2020-01",
      endDate: null,
      isCurrent: true,
      accomplishments: ["Built microservices", "Led team of 3"],
      skills: ["TypeScript", "React"],
    },
  ],
  education: [
    {
      university: "MIT",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: "2013-09",
      endDate: "2017-05",
    },
  ],
  projects: [
    {
      title: "OpenSource Tool",
      description: "A helpful tool",
      technologies: ["TypeScript", "PostgreSQL"],
    },
  ],
  certificates: [
    {
      name: "AWS Solutions Architect",
      issuingOrganisation: "Amazon",
      startDate: "2022-01",
      endDate: "2025-01",
    },
  ],
  skills: [
    { name: "TypeScript", category: "Languages", proficiency: "Expert" },
    { name: "React", category: "Frameworks", proficiency: "Advanced" },
  ],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Conversational" },
  ],
};

describe("validateFactualPreservation", () => {
  describe("employer cannot change", () => {
    it("rejects changed company name", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            company: "DifferentCorp",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("company"))).toBe(
        true,
      );
    });
  });

  describe("job title cannot change", () => {
    it("rejects changed job title", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            title: "Staff Engineer",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("title"))).toBe(
        true,
      );
    });
  });

  describe("dates cannot change", () => {
    it("rejects changed start date", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            startDate: "2021-01",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some((v) => v.field.includes("startDate")),
      ).toBe(true);
    });

    it("rejects changed end date", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            endDate: "2023-12",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some((v) => v.field.includes("endDate")),
      ).toBe(true);
    });
  });

  describe("school cannot change", () => {
    it("rejects changed university name", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        education: [
          {
            ...SOURCE_RESUME.education![0],
            university: "Stanford",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some((v) => v.field.includes("university")),
      ).toBe(true);
    });
  });

  describe("degree cannot change", () => {
    it("rejects changed degree", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        education: [
          {
            ...SOURCE_RESUME.education![0],
            degree: "MS",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("degree"))).toBe(
        true,
      );
    });
  });

  describe("certification cannot change", () => {
    it("rejects changed certification name", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        certificates: [
          {
            ...SOURCE_RESUME.certificates![0],
            name: "AWS Developer",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("name"))).toBe(
        true,
      );
    });
  });

  describe("contact information cannot change", () => {
    it("rejects changed email", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        profile: {
          ...SOURCE_RESUME.profile,
          email: "new@example.com",
        },
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("email"))).toBe(
        true,
      );
    });

    it("rejects changed phone", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        profile: {
          ...SOURCE_RESUME.profile,
          phone: "+1-555-9999",
        },
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.field.includes("phone"))).toBe(
        true,
      );
    });
  });

  describe("fake metrics rejected", () => {
    it("rejects summary with new percentage", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        summary: "Improved application performance by 40%.",
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some((v) => v.field === "summary"),
      ).toBe(true);
    });

    it("rejects experience with new metric", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            accomplishments: [
              "Built microservices",
              "Improved performance by 50%",
            ],
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some(
          (v) =>
            v.field.includes("accomplishments") &&
            v.actual.includes("metric"),
        ),
      ).toBe(true);
    });
  });

  describe("unsupported skills rejected", () => {
    it("rejects new skills not in source", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        skills: [
          ...SOURCE_RESUME.skills!,
          {
            name: "Python",
            category: "Languages",
            proficiency: "Intermediate",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some(
          (v) => v.field === "skills" && v.actual.includes("Python"),
        ),
      ).toBe(true);
    });
  });

  describe("job-description-only skill is not added", () => {
    it("rejects skills from job description not in source", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        skills: [
          ...SOURCE_RESUME.skills!,
          {
            name: "Kubernetes",
            category: "DevOps",
            proficiency: "Intermediate",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
    });
  });

  describe("source numeric metrics may be retained", () => {
    it("allows summary with metrics from source", () => {
      const sourceWithMetrics: ResumeSnapshot = {
        ...SOURCE_RESUME,
        summary:
          "A software engineer with 5 years of experience leading teams of 3.",
      };

      const optimized: ResumeSnapshot = {
        ...sourceWithMetrics,
        summary:
          "Experienced software engineer with 5 years leading teams of 3.",
      };

      const result = validateFactualPreservation(
        sourceWithMetrics,
        optimized,
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("rewritable text fields", () => {
    it("allows summary rewrite", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        summary:
          "Experienced software engineer with expertise in building scalable applications.",
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("allows experience bullet rewrite", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          {
            ...SOURCE_RESUME.experiences![0],
            accomplishments: [
              "Architected and deployed microservices infrastructure",
              "Mentored and guided a team of 3 engineers",
            ],
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });
  });

  describe("skill ordering may change", () => {
    it("allows reordered skills without new ones", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        skills: [
          { name: "React", category: "Frameworks", proficiency: "Advanced" },
          {
            name: "TypeScript",
            category: "Languages",
            proficiency: "Expert",
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });
  });

  describe("experience count mismatch", () => {
    it("rejects different number of experiences", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some(
          (v) => v.section === "experiences" && v.field === "count",
        ),
      ).toBe(true);
    });
  });

  describe("identical resumes", () => {
    it("validates identical resumes as valid", () => {
      const result = validateFactualPreservation(
        SOURCE_RESUME,
        SOURCE_RESUME,
      );
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("project technologies", () => {
    it("rejects new technologies not in source", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        projects: [
          {
            ...SOURCE_RESUME.projects![0],
            technologies: [
              "TypeScript",
              "PostgreSQL",
              "Redis",
            ],
          },
        ],
      };

      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
      expect(
        result.violations.some(
          (v) =>
            v.field.includes("technologies") && v.actual.includes("Redis"),
        ),
      ).toBe(true);
    });
  });
});
