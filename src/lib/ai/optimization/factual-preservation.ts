// ─────────────────────────────────────────────────────────────
// Factual Preservation Validation
// ─────────────────────────────────────────────────────────────
// Deterministic safeguards to ensure the AI provider does not
// alter immutable factual fields. Compares optimized output
// against the source resume and rejects unauthorized changes.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

// ── Validation Result ────────────────────────────────────────

export interface FactualValidationResult {
  valid: boolean;
  violations: FactualViolation[];
}

export interface FactualViolation {
  section: string;
  field: string;
  expected: string;
  actual: string;
}

// ── Immutable Fields ─────────────────────────────────────────

interface ImmutableField {
  path: string;
  getValue: (snapshot: ResumeSnapshot) => string | undefined;
}

const IMMUTABLE_FIELDS: ImmutableField[] = [
  // Profile
  {
    path: "profile.name",
    getValue: (s) => s.profile?.name,
  },
  {
    path: "profile.email",
    getValue: (s) => s.profile?.email,
  },
  {
    path: "profile.phone",
    getValue: (s) => s.profile?.phone,
  },
  {
    path: "profile.city",
    getValue: (s) => s.profile?.city,
  },
  {
    path: "profile.country",
    getValue: (s) => s.profile?.country,
  },
  {
    path: "profile.githubUrl",
    getValue: (s) => s.profile?.githubUrl,
  },
  {
    path: "profile.linkedinUrl",
    getValue: (s) => s.profile?.linkedinUrl,
  },
  {
    path: "profile.portfolioUrl",
    getValue: (s) => s.profile?.portfolioUrl,
  },
];

// ── Validators ───────────────────────────────────────────────

function validateImmutableFields(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];

  for (const field of IMMUTABLE_FIELDS) {
    const sourceValue = field.getValue(source);
    const optimizedValue = field.getValue(optimized);

    if (
      sourceValue !== undefined &&
      optimizedValue !== undefined &&
      sourceValue !== optimizedValue
    ) {
      violations.push({
        section: field.path.split(".")[0],
        field: field.path,
        expected: sourceValue,
        actual: optimizedValue,
      });
    }
  }

  return violations;
}

function validateExperiences(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceExps = source.experiences ?? [];
  const optimizedExps = optimized.experiences ?? [];

  if (sourceExps.length !== optimizedExps.length) {
    violations.push({
      section: "experiences",
      field: "count",
      expected: String(sourceExps.length),
      actual: String(optimizedExps.length),
    });
    return violations;
  }

  for (let i = 0; i < sourceExps.length; i++) {
    const src = sourceExps[i];
    const opt = optimizedExps[i];

    // Company name is immutable
    if (src.company !== opt.company) {
      violations.push({
        section: "experiences",
        field: `experiences[${i}].company`,
        expected: src.company,
        actual: opt.company,
      });
    }

    // Job title is immutable
    if (src.title !== opt.title) {
      violations.push({
        section: "experiences",
        field: `experiences[${i}].title`,
        expected: src.title,
        actual: opt.title,
      });
    }

    // Dates are immutable
    if (src.startDate !== opt.startDate) {
      violations.push({
        section: "experiences",
        field: `experiences[${i}].startDate`,
        expected: src.startDate,
        actual: opt.startDate,
      });
    }
    if (src.endDate !== opt.endDate) {
      violations.push({
        section: "experiences",
        field: `experiences[${i}].endDate`,
        expected: src.endDate ?? "null",
        actual: opt.endDate ?? "null",
      });
    }

    // Skills: can be reordered but not added
    const srcSkills = new Set(src.skills ?? []);
    const optSkills = opt.skills ?? [];
    for (const skill of optSkills) {
      if (!srcSkills.has(skill)) {
        violations.push({
          section: "experiences",
          field: `experiences[${i}].skills`,
          expected: `skill "${skill}" not in source`,
          actual: `skill "${skill}" added`,
        });
      }
    }
  }

  return violations;
}

function validateEducation(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceEdu = source.education ?? [];
  const optimizedEdu = optimized.education ?? [];

  if (sourceEdu.length !== optimizedEdu.length) {
    violations.push({
      section: "education",
      field: "count",
      expected: String(sourceEdu.length),
      actual: String(optimizedEdu.length),
    });
    return violations;
  }

  for (let i = 0; i < sourceEdu.length; i++) {
    const src = sourceEdu[i];
    const opt = optimizedEdu[i];

    if (src.university !== opt.university) {
      violations.push({
        section: "education",
        field: `education[${i}].university`,
        expected: src.university,
        actual: opt.university,
      });
    }
    if (src.degree !== opt.degree) {
      violations.push({
        section: "education",
        field: `education[${i}].degree`,
        expected: src.degree,
        actual: opt.degree,
      });
    }
    if (src.startDate !== opt.startDate) {
      violations.push({
        section: "education",
        field: `education[${i}].startDate`,
        expected: src.startDate,
        actual: opt.startDate,
      });
    }
    if (src.endDate !== opt.endDate) {
      violations.push({
        section: "education",
        field: `education[${i}].endDate`,
        expected: src.endDate ?? "null",
        actual: opt.endDate ?? "null",
      });
    }
  }

  return violations;
}

function validateProjects(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceProj = source.projects ?? [];
  const optimizedProj = optimized.projects ?? [];

  if (sourceProj.length !== optimizedProj.length) {
    violations.push({
      section: "projects",
      field: "count",
      expected: String(sourceProj.length),
      actual: String(optimizedProj.length),
    });
    return violations;
  }

  for (let i = 0; i < sourceProj.length; i++) {
    const src = sourceProj[i];
    const opt = optimizedProj[i];

    if (src.title !== opt.title) {
      violations.push({
        section: "projects",
        field: `projects[${i}].title`,
        expected: src.title,
        actual: opt.title,
      });
    }

    // Technologies: can be reordered but not added
    const srcTech = new Set(src.technologies ?? []);
    const optTech = opt.technologies ?? [];
    for (const tech of optTech) {
      if (!srcTech.has(tech)) {
        violations.push({
          section: "projects",
          field: `projects[${i}].technologies`,
          expected: `technology "${tech}" not in source`,
          actual: `technology "${tech}" added`,
        });
      }
    }
  }

  return violations;
}

function validateCertificates(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceCerts = source.certificates ?? [];
  const optimizedCerts = optimized.certificates ?? [];

  if (sourceCerts.length !== optimizedCerts.length) {
    violations.push({
      section: "certificates",
      field: "count",
      expected: String(sourceCerts.length),
      actual: String(optimizedCerts.length),
    });
    return violations;
  }

  for (let i = 0; i < sourceCerts.length; i++) {
    const src = sourceCerts[i];
    const opt = optimizedCerts[i];

    if (src.name !== opt.name) {
      violations.push({
        section: "certificates",
        field: `certificates[${i}].name`,
        expected: src.name,
        actual: opt.name,
      });
    }
    if (src.issuingOrganisation !== opt.issuingOrganisation) {
      violations.push({
        section: "certificates",
        field: `certificates[${i}].issuingOrganisation`,
        expected: src.issuingOrganisation ?? "undefined",
        actual: opt.issuingOrganisation ?? "undefined",
      });
    }
    if (src.startDate !== opt.startDate) {
      violations.push({
        section: "certificates",
        field: `certificates[${i}].startDate`,
        expected: src.startDate,
        actual: opt.startDate,
      });
    }
  }

  return violations;
}

function validateSkills(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceSkills = new Set(
    (source.skills ?? []).map((s) => s.name.toLowerCase()),
  );
  const optimizedSkills = optimized.skills ?? [];

  for (const skill of optimizedSkills) {
    if (!sourceSkills.has(skill.name.toLowerCase())) {
      violations.push({
        section: "skills",
        field: "skills",
        expected: `skill "${skill.name}" not in source`,
        actual: `skill "${skill.name}" added`,
      });
    }
  }

  return violations;
}

function validateLanguages(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceLangs = new Set(
    (source.languages ?? []).map((l) => l.name.toLowerCase()),
  );
  const optimizedLangs = optimized.languages ?? [];

  for (const lang of optimizedLangs) {
    if (!sourceLangs.has(lang.name.toLowerCase())) {
      violations.push({
        section: "languages",
        field: "languages",
        expected: `language "${lang.name}" not in source`,
        actual: `language "${lang.name}" added`,
      });
    }
  }

  return violations;
}

// ── Fake Metric Detection ────────────────────────────────────

const METRIC_PATTERNS = [
  /\b\d+%\b/, // 40%, 85%
  /\b\d+\s*(?:percent|percentage)\b/i,
  /\b(?:increased|improved|reduced|decreased|grew|boosted)\b.*?\b\d+/i,
  /\b\d+\s*(?:x|times)\b/i,
];

function containsFakeMetrics(
  optimized: ResumeSnapshot,
  source: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];

  // Extract all numeric values from source resume
  const sourceText = JSON.stringify(source);

  // Check summary for new metrics
  if (optimized.summary) {
    for (const pattern of METRIC_PATTERNS) {
      const matches = optimized.summary.match(pattern);
      if (matches) {
        const metricValue = matches[0];
        // Check if this metric exists in source
        if (!sourceText.includes(metricValue)) {
          violations.push({
            section: "summary",
            field: "summary",
            expected: "no new metrics",
            actual: `contains metric "${metricValue}" not in source`,
          });
        }
      }
    }
  }

  // Check experience accomplishments for new metrics
  const optimizedExps = optimized.experiences ?? [];
  for (let i = 0; i < optimizedExps.length; i++) {
    const accomplishments = optimizedExps[i].accomplishments ?? [];
    for (const bullet of accomplishments) {
      for (const pattern of METRIC_PATTERNS) {
        const matches = bullet.match(pattern);
        if (matches) {
          const metricValue = matches[0];
          if (!sourceText.includes(metricValue)) {
            // Check if source has this experience
            const sourceExps = source.experiences ?? [];
            const sourceExp = sourceExps[i];
            if (sourceExp) {
              const sourceAccomplishments =
                sourceExp.accomplishments?.join(" ") ?? "";
              if (!sourceAccomplishments.includes(metricValue)) {
                violations.push({
                  section: "experiences",
                  field: `experiences[${i}].accomplishments`,
                  expected: "no new metrics",
                  actual: `contains metric "${metricValue}" not in source`,
                });
              }
            }
          }
        }
      }
    }
  }

  return violations;
}

// ── Main Validation ──────────────────────────────────────────

/**
 * Validate that the optimized resume preserves all factual data
 * from the source resume.
 */
export function validateFactualPreservation(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualValidationResult {
  const violations: FactualViolation[] = [
    ...validateImmutableFields(source, optimized),
    ...validateExperiences(source, optimized),
    ...validateEducation(source, optimized),
    ...validateProjects(source, optimized),
    ...validateCertificates(source, optimized),
    ...validateSkills(source, optimized),
    ...validateLanguages(source, optimized),
    ...containsFakeMetrics(optimized, source),
  ];

  return {
    valid: violations.length === 0,
    violations,
  };
}
