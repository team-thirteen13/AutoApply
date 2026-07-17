import { describe, it, expect } from "vitest";
import { validateFactualPreservation } from "../factual-preservation";
import type { ResumeSnapshot } from "@/types/resume";

/**
 * Prompt injection regression tests.
 * These tests verify that a malicious job description cannot cause
 * the optimization service to fabricate facts not in the source resume.
 */

const BASE_RESUME: ResumeSnapshot = {
  profile: {
    name: "Jane Developer",
    title: "Frontend Developer",
    email: "jane@example.com",
    phone: "+1-555-0100",
  },
  summary: "Frontend developer with React experience.",
  experiences: [
    {
      company: "WebCo",
      title: "Frontend Developer",
      startDate: "2021-03",
      endDate: null,
      isCurrent: true,
      accomplishments: ["Built React components"],
      skills: ["React", "JavaScript"],
    },
  ],
  skills: [
    { name: "React", category: "Frameworks", proficiency: "Advanced" },
    { name: "JavaScript", category: "Languages", proficiency: "Expert" },
  ],
};

describe("Prompt injection protection", () => {
  it("ignores instruction to add AWS experience", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      skills: [
        ...BASE_RESUME.skills!,
        {
          name: "AWS",
          category: "Cloud",
          proficiency: "Expert",
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.violations.some(
        (v) => v.field === "skills" && v.actual.includes("AWS"),
      ),
    ).toBe(true);
  });

  it("ignores instruction to add fake skills via job description", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      skills: [
        ...BASE_RESUME.skills!,
        {
          name: "Python",
          category: "Languages",
          proficiency: "Expert",
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    // Should detect that "Python" is not in source
    expect(validation.valid).toBe(false);
  });

  it("ignores instruction to change job title", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      experiences: [
        {
          ...BASE_RESUME.experiences![0],
          title: "Senior Staff Principal Engineer",
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.violations.some((v) => v.field.includes("title")),
    ).toBe(true);
  });

  it("ignores instruction to add employers", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      experiences: [
        ...BASE_RESUME.experiences!,
        {
          company: "Google",
          title: "Senior Engineer",
          startDate: "2018-01",
          endDate: "2021-02",
          accomplishments: ["Led cloud migration"],
          skills: ["Go", "GCP"],
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.violations.some(
        (v) =>
          v.section === "experiences" && v.field === "count",
      ),
    ).toBe(true);
  });

  it("ignores instruction to add education", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      education: [
        {
          university: "MIT",
          degree: "MS",
          fieldOfStudy: "Computer Science",
          startDate: "2015-09",
          endDate: "2017-05",
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.violations.some(
        (v) => v.section === "education" && v.field === "count",
      ),
    ).toBe(true);
  });

  it("ignores instruction to change contact info", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      profile: {
        ...BASE_RESUME.profile,
        email: "hacker@evil.com",
        phone: "+1-555-9999",
      },
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.violations.some((v) => v.field.includes("email")),
    ).toBe(true);
    expect(
      validation.violations.some((v) => v.field.includes("phone")),
    ).toBe(true);
  });

  it("allows legitimate optimizations despite malicious context", () => {
    const legitimateResult: ResumeSnapshot = {
      ...BASE_RESUME,
      summary:
        "Skilled frontend developer with expertise in building scalable React applications.",
      experiences: [
        {
          ...BASE_RESUME.experiences![0],
          accomplishments: [
            "Architected and developed reusable React component library",
          ],
        },
      ],
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      legitimateResult,
    );
    expect(validation.valid).toBe(true);
  });
});
