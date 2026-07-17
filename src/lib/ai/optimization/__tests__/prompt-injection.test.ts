import { describe, it, expect } from "vitest";
import {
  validateFactualPreservation,
  overlayImmutableFields,
} from "../factual-preservation";
import type { ResumeSnapshot } from "@/types/resume";

/**
 * Prompt injection regression tests.
 * These tests verify that a malicious job description cannot cause
 * the optimization service to fabricate facts not in the source resume.
 *
 * With the deterministic overlay, added skills/employers/education are
 * removed and changed fields are restored. Fabricated metrics are still
 * rejected.
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
  it("overlay removes added AWS skill", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      skills: [
        ...BASE_RESUME.skills!,
        { name: "AWS", category: "Cloud", proficiency: "Expert" },
      ],
    };

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    const skillNames = safe.skills?.map((s) => s.name);
    expect(skillNames).not.toContain("AWS");
  });

  it("overlay removes added Python skill", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      skills: [
        ...BASE_RESUME.skills!,
        { name: "Python", category: "Languages", proficiency: "Expert" },
      ],
    };

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    const skillNames = safe.skills?.map((s) => s.name);
    expect(skillNames).not.toContain("Python");
  });

  it("overlay restores changed job title", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      experiences: [
        {
          ...BASE_RESUME.experiences![0],
          title: "Senior Staff Principal Engineer",
        },
      ],
    };

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    expect(safe.experiences?.[0].title).toBe("Frontend Developer");
  });

  it("overlay removes added employer", () => {
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

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    expect(safe.experiences?.length).toBe(1);
    expect(safe.experiences?.[0].company).toBe("WebCo");
  });

  it("overlay removes added education", () => {
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

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    // Source has no education, so overlay should not add any
    expect(safe.education).toBeUndefined();
  });

  it("overlay restores changed contact info", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      profile: {
        ...BASE_RESUME.profile,
        email: "hacker@evil.com",
        phone: "+1-555-9999",
      },
    };

    const safe = overlayImmutableFields(BASE_RESUME, maliciousResult);
    expect(safe.profile?.email).toBe("jane@example.com");
    expect(safe.profile?.phone).toBe("+1-555-0100");
  });

  it("fabricated metrics are rejected even after overlay", () => {
    const maliciousResult: ResumeSnapshot = {
      ...BASE_RESUME,
      summary: "Improved performance by 40%.",
    };

    const validation = validateFactualPreservation(
      BASE_RESUME,
      maliciousResult,
    );
    expect(validation.valid).toBe(false);
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
