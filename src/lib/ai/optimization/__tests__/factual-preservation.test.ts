import { describe, it, expect } from "vitest";
import {
  validateFactualPreservation,
  overlayImmutableFields,
} from "../factual-preservation";
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
  // With the deterministic overlay, changed immutable fields are silently
  // restored from source. These tests verify the overlay fixes them
  // (valid: true after overlay), while fabricated metrics still fail.

  describe("immutable fields are restored by overlay", () => {
    it("restores changed company name", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          { ...SOURCE_RESUME.experiences![0], company: "DifferentCorp" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed job title", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          { ...SOURCE_RESUME.experiences![0], title: "Staff Engineer" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed dates", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [
          { ...SOURCE_RESUME.experiences![0], startDate: "2021-01" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed university", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        education: [
          { ...SOURCE_RESUME.education![0], university: "Stanford" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed degree", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        education: [{ ...SOURCE_RESUME.education![0], degree: "MS" }],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed certification name", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        certificates: [
          { ...SOURCE_RESUME.certificates![0], name: "AWS Developer" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores changed contact info", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        profile: {
          ...SOURCE_RESUME.profile,
          email: "hacker@evil.com",
          phone: "+1-555-9999",
        },
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("removes unsupported skills", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        skills: [
          ...SOURCE_RESUME.skills!,
          { name: "Python", category: "Languages", proficiency: "Intermediate" },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("removes unsupported technologies", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        projects: [
          {
            ...SOURCE_RESUME.projects![0],
            technologies: ["TypeScript", "PostgreSQL", "Redis"],
          },
        ],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });

    it("restores experience count from source", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        experiences: [],
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(true);
    });
  });

  describe("fabricated metrics are rejected", () => {
    it("rejects summary with new percentage", () => {
      const optimized: ResumeSnapshot = {
        ...SOURCE_RESUME,
        summary: "Improved application performance by 40%.",
      };
      const result = validateFactualPreservation(SOURCE_RESUME, optimized);
      expect(result.valid).toBe(false);
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

  describe("identical resumes", () => {
    it("validates identical resumes as valid", () => {
      const result = validateFactualPreservation(SOURCE_RESUME, SOURCE_RESUME);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
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
});

// ── Overlay Tests ────────────────────────────────────────────

describe("overlayImmutableFields", () => {
  it("restores profile name from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      profile: { ...SOURCE_RESUME.profile, name: "Hacker" },
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.profile?.name).toBe("John Doe");
  });

  it("restores employer from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        { ...SOURCE_RESUME.experiences![0], company: "EvilCorp" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.experiences?.[0].company).toBe("TechCorp");
  });

  it("restores job title from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        { ...SOURCE_RESUME.experiences![0], title: "CEO" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.experiences?.[0].title).toBe("Senior Engineer");
  });

  it("restores dates from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        { ...SOURCE_RESUME.experiences![0], startDate: "2015-01" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.experiences?.[0].startDate).toBe("2020-01");
  });

  it("restores school from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      education: [
        { ...SOURCE_RESUME.education![0], university: "Stanford" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.education?.[0].university).toBe("MIT");
  });

  it("restores degree from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      education: [
        { ...SOURCE_RESUME.education![0], degree: "PhD" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.education?.[0].degree).toBe("BS");
  });

  it("restores certification name from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      certificates: [
        { ...SOURCE_RESUME.certificates![0], name: "Fake Cert" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.certificates?.[0].name).toBe("AWS Solutions Architect");
  });

  it("restores contact info from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      profile: {
        ...SOURCE_RESUME.profile,
        email: "hacker@evil.com",
        phone: "+1-555-9999",
      },
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.profile?.email).toBe("john@example.com");
    expect(safe.profile?.phone).toBe("+1-555-0100");
  });

  it("removes unsupported skills", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      skills: [
        ...SOURCE_RESUME.skills!,
        { name: "Python", category: "Languages", proficiency: "Expert" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    const skillNames = safe.skills?.map((s) => s.name);
    expect(skillNames).not.toContain("Python");
  });

  it("removes unsupported languages", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      languages: [
        ...SOURCE_RESUME.languages!,
        { name: "Mandarin", proficiency: "Fluent" },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    const langNames = safe.languages?.map((l) => l.name);
    expect(langNames).not.toContain("Mandarin");
  });

  it("removes unsupported technologies", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      projects: [
        {
          ...SOURCE_RESUME.projects![0],
          technologies: [
            ...(SOURCE_RESUME.projects![0].technologies ?? []),
            "Redis",
          ],
        },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    const techs = safe.projects?.[0].technologies;
    expect(techs).not.toContain("Redis");
  });

  it("allows summary rewrite", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      summary: "Experienced engineer with expertise in scalable systems.",
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.summary).toBe(
      "Experienced engineer with expertise in scalable systems.",
    );
  });

  it("allows experience bullet rewrite", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        {
          ...SOURCE_RESUME.experiences![0],
          accomplishments: [
            "Architected and deployed microservices infrastructure",
          ],
        },
      ],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.experiences?.[0].accomplishments?.[0]).toBe(
      "Architected and deployed microservices infrastructure",
    );
  });

  it("preserves experience count from source", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [],
    };

    const safe = overlayImmutableFields(SOURCE_RESUME, optimized);
    expect(safe.experiences?.length).toBe(1);
  });
});

// ── Expanded Metric Detection ────────────────────────────────

describe("expanded metric detection", () => {
  it("rejects currency metrics", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      summary: "Managed budgets of $1M annually.",
    };

    const result = validateFactualPreservation(SOURCE_RESUME, optimized);
    expect(result.valid).toBe(false);
  });

  it("rejects multiplier metrics", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        {
          ...SOURCE_RESUME.experiences![0],
          accomplishments: ["Improved performance 3x"],
        },
      ],
    };

    const result = validateFactualPreservation(SOURCE_RESUME, optimized);
    expect(result.valid).toBe(false);
  });

  it("rejects 'doubled' claims", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        {
          ...SOURCE_RESUME.experiences![0],
          accomplishments: ["Doubled revenue"],
        },
      ],
    };

    const result = validateFactualPreservation(SOURCE_RESUME, optimized);
    expect(result.valid).toBe(false);
  });

  it("rejects 'reduced by half' claims", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      experiences: [
        {
          ...SOURCE_RESUME.experiences![0],
          accomplishments: ["Reduced costs by half"],
        },
      ],
    };

    const result = validateFactualPreservation(SOURCE_RESUME, optimized);
    expect(result.valid).toBe(false);
  });

  it("rejects user-count metrics", () => {
    const optimized: ResumeSnapshot = {
      ...SOURCE_RESUME,
      summary: "Served 10,000 users daily.",
    };

    const result = validateFactualPreservation(SOURCE_RESUME, optimized);
    expect(result.valid).toBe(false);
  });

  it("allows existing metrics from source", () => {
    const sourceWithMetrics: ResumeSnapshot = {
      ...SOURCE_RESUME,
      summary: "Improved performance by 40%.",
    };

    const result = validateFactualPreservation(
      sourceWithMetrics,
      sourceWithMetrics,
    );
    expect(result.valid).toBe(true);
  });
});
