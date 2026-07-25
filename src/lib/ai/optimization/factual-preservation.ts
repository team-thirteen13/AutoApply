// ─────────────────────────────────────────────────────────────
// Factual Preservation Validation
// ─────────────────────────────────────────────────────────────
// Deterministic safeguards to ensure the AI provider does not
// alter immutable factual fields or invent new facts.
//
// Strategy: deterministic source-overlay for immutable fields,
// membership-based validation for collections, and expanded
// metric fabrication detection.
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

// ── Deterministic Source Overlay ─────────────────────────────
/**
 * Creates a safe copy of the optimized resume by deterministically
 * overwriting all immutable fields from the source. This is the
 * primary defense — violations are detected but the overlay
 * ensures correctness regardless.
 */
export function overlayImmutableFields(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): ResumeSnapshot {
  // Deep clone to avoid mutating the optimized result
  const safe = JSON.parse(JSON.stringify(optimized)) as ResumeSnapshot;

  // Overlay profile immutable fields
  if (safe.profile && source.profile) {
    safe.profile.name = source.profile.name;
    safe.profile.title = source.profile.title;
    safe.profile.email = source.profile.email;
    safe.profile.phone = source.profile.phone;
    safe.profile.city = source.profile.city;
    safe.profile.country = source.profile.country;
    safe.profile.githubUrl = source.profile.githubUrl;
    safe.profile.linkedinUrl = source.profile.linkedinUrl;
    safe.profile.portfolioUrl = source.profile.portfolioUrl;
    safe.profile.photoUrl = source.profile.photoUrl;
  }

  // Overlay experiences — match by ID or array position
  // If source has no experiences, remove any from optimized
  if (!source.experiences) {
    safe.experiences = undefined;
  } else if (safe.experiences && source.experiences) {
    const sourceMap = buildIndexMap(source.experiences);
    safe.experiences = safe.experiences.map((optExp) => {
      const srcExp = findSourceItem(source.experiences!, sourceMap, optExp.id, {
        company: optExp.company,
        title: optExp.title,
        startDate: optExp.startDate,
      });
      if (!srcExp) {
        // New experience not in source — remove it
        return null;
      }
      return {
        ...optExp,
        id: srcExp.id,
        company: srcExp.company,
        title: srcExp.title,
        startDate: srcExp.startDate,
        endDate: srcExp.endDate,
        isCurrent: srcExp.isCurrent,
        // Skills: filter to only source skills
        skills: filterToSourceMembers(optExp.skills ?? [], srcExp.skills ?? []),
      };
    }).filter(Boolean) as NonNullable<ResumeSnapshot["experiences"]>;

    // Check count mismatch
    if (safe.experiences.length !== source.experiences.length) {
      // Restore source experiences entirely if count doesn't match
      safe.experiences = source.experiences.map((exp) => ({ ...exp }));
    }
  }

  // Overlay education — match by ID or array position
  if (!source.education) {
    safe.education = undefined;
  } else if (safe.education && source.education) {
    const sourceMap = buildIndexMap(source.education);
    safe.education = safe.education.map((optEdu) => {
      const srcEdu = findSourceItem(source.education!, sourceMap, optEdu.id, {
        university: optEdu.university,
        degree: optEdu.degree,
        startDate: optEdu.startDate,
      });
      if (!srcEdu) return null;
      return {
        ...optEdu,
        id: srcEdu.id,
        university: srcEdu.university,
        degree: srcEdu.degree,
        startDate: srcEdu.startDate,
        endDate: srcEdu.endDate,
        isCurrent: srcEdu.isCurrent,
      };
    }).filter(Boolean) as NonNullable<ResumeSnapshot["education"]>;

    if (safe.education.length !== source.education.length) {
      safe.education = source.education.map((edu) => ({ ...edu }));
    }
  }

  // Overlay projects — match by ID or array position
  if (!source.projects) {
    safe.projects = undefined;
  } else if (safe.projects && source.projects) {
    const sourceMap = buildIndexMap(source.projects);
    safe.projects = safe.projects.map((optProj) => {
      const srcProj = findSourceItem(source.projects!, sourceMap, optProj.id, {
        title: optProj.title,
      });
      if (!srcProj) return null;
      return {
        ...optProj,
        id: srcProj.id,
        title: srcProj.title,
        // Technologies: filter to only source technologies
        technologies: filterToSourceMembers(
          optProj.technologies ?? [],
          srcProj.technologies ?? [],
        ),
      };
    }).filter(Boolean) as NonNullable<ResumeSnapshot["projects"]>;

    if (safe.projects.length !== source.projects.length) {
      safe.projects = source.projects.map((proj) => ({ ...proj }));
    }
  }

  // Overlay certificates — match by ID or array position
  if (!source.certificates) {
    safe.certificates = undefined;
  } else if (safe.certificates && source.certificates) {
    const sourceMap = buildIndexMap(source.certificates);
    safe.certificates = safe.certificates.map((optCert) => {
      const srcCert = findSourceItem(
        source.certificates!,
        sourceMap,
        optCert.id,
        { name: optCert.name, startDate: optCert.startDate },
      );
      if (!srcCert) return null;
      return {
        ...optCert,
        id: srcCert.id,
        name: srcCert.name,
        issuingOrganisation: srcCert.issuingOrganisation,
        startDate: srcCert.startDate,
        endDate: srcCert.endDate,
      };
    }).filter(Boolean) as NonNullable<ResumeSnapshot["certificates"]>;

    if (safe.certificates.length !== source.certificates.length) {
      safe.certificates = source.certificates.map((cert) => ({ ...cert }));
    }
  }

  // Skills: filter to only source skill names (reordering allowed)
  if (!source.skills) {
    safe.skills = undefined;
  } else if (safe.skills && source.skills) {
    const sourceSkillNames = new Set(
      source.skills.map((s) => s.name.toLowerCase()),
    );
    safe.skills = safe.skills.filter((s) =>
      sourceSkillNames.has(s.name.toLowerCase()),
    );
    if (safe.skills.length !== source.skills.length) {
      safe.skills = source.skills.map((s) => ({ ...s }));
    }
  }

  // Languages: filter to only source language names
  if (!source.languages) {
    safe.languages = undefined;
  } else if (safe.languages && source.languages) {
    const sourceLangNames = new Set(
      source.languages.map((l) => l.name.toLowerCase()),
    );
    safe.languages = safe.languages.filter((l) =>
      sourceLangNames.has(l.name.toLowerCase()),
    );
    if (safe.languages.length !== source.languages.length) {
      safe.languages = source.languages.map((l) => ({ ...l }));
    }
  }

  return safe;
}

// ── Collection Matching Helpers ──────────────────────────────

type SourceItem = { id?: string };

/**
 * Build an index map from source items by ID.
 */
function buildIndexMap<T extends SourceItem>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item.id) map.set(item.id, item);
  }
  return map;
}

/**
 * Find a source item by ID first, then by signature fallback.
 */
function findSourceItem<T extends SourceItem>(
  sourceItems: T[],
  idMap: Map<string, T>,
  optId: string | undefined,
  signature: Record<string, unknown>,
): T | undefined {
  // Try ID match first
  if (optId && idMap.has(optId)) {
    return idMap.get(optId);
  }

  // Fallback: match by immutable signature fields
  return sourceItems.find((item) => {
    for (const [key, value] of Object.entries(signature)) {
      if ((item as Record<string, unknown>)[key] !== value) return false;
    }
    return true;
  });
}

/**
 * Filter optimized array to only members present in source (case-insensitive).
 */
function filterToSourceMembers(
  optimized: string[],
  source: string[],
): string[] {
  const sourceSet = new Set(source.map((s) => s.toLowerCase()));
  return optimized.filter((s) => sourceSet.has(s.toLowerCase()));
}

// ── Violation Detection (for metadata, not control flow) ────

function detectImmutableViolations(
  source: ResumeSnapshot,
  safe: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];

  // Profile
  const profileChecks: [string, string | undefined, string | undefined][] = [
    ["profile.name", source.profile?.name, safe.profile?.name],
    ["profile.email", source.profile?.email, safe.profile?.email],
    ["profile.phone", source.profile?.phone, safe.profile?.phone],
  ];

  for (const [field, src, opt] of profileChecks) {
    if (src !== undefined && opt !== undefined && src !== opt) {
      violations.push({
        section: "profile",
        field,
        expected: src,
        actual: opt,
      });
    }
  }

  return violations;
}

// ── Fake Metric Detection ────────────────────────────────────

/**
 * Expanded patterns to catch fabricated metrics.
 * Source text is checked to ensure the metric already exists.
 * Note: avoid \b after non-word chars like % — use lookahead/lookbehind instead.
 */
const METRIC_PATTERNS: RegExp[] = [
  /\b\d+%(?!\w)/,                       // 40%, 85%
  /\b\d+\s*(?:percent|percentage)\b/i,  // 40 percent, 85 percentage
  /\$\d[\d,]*(?:\.\d+)?[KMBkmb]?(?!\w)/, // $1M, $100K, $1.5B
  /\b\d+\s*(?:x|times)\b/i,            // 2x, 3 times
  /\b(?:doubled|tripled|quadrupled)\b/i, // doubled, tripled
  /\b(?:reduced|cut|increased|improved|boosted|grew|decreased)\s+(?:by\s+)?(?:a\s+)?(?:factor\s+of\s+)?\d+/i,
  /\b(?:by|to)\s+(?:a\s+)?(?:half|third|quarter)\b/i,
  /\b\d[\d,]*\s*(?:users|customers|clients|requests|transactions|employees|team\s+members|people|hours|days|months|years)\b/i,
  /\bten\s+thousand\b/i,
  /\bhundred\s+thousand\b/i,
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:million|billion|thousand)\b/i,
];

function containsFabricatedMetrics(
  optimized: ResumeSnapshot,
  source: ResumeSnapshot,
): FactualViolation[] {
  const violations: FactualViolation[] = [];
  const sourceText = JSON.stringify(source);

  // Check summary
  if (optimized.summary) {
    for (const pattern of METRIC_PATTERNS) {
      const matches = optimized.summary.match(pattern);
      if (matches && !sourceText.includes(matches[0])) {
        violations.push({
          section: "summary",
          field: "summary",
          expected: "no fabricated metrics",
          actual: `contains metric "${matches[0]}" not in source`,
        });
        break; // One violation per section is sufficient
      }
    }
  }

  // Check experience accomplishments
  const sourceExps = source.experiences ?? [];
  const optimizedExps = optimized.experiences ?? [];
  for (let i = 0; i < optimizedExps.length; i++) {
    const srcAccomplishments = sourceExps[i]?.accomplishments?.join(" ") ?? "";
    const optAccomplishments = optimizedExps[i].accomplishments ?? [];
    for (const bullet of optAccomplishments) {
      for (const pattern of METRIC_PATTERNS) {
        const matches = bullet.match(pattern);
        if (
          matches &&
          !sourceText.includes(matches[0]) &&
          !srcAccomplishments.includes(matches[0])
        ) {
          violations.push({
            section: "experiences",
            field: `experiences[${i}].accomplishments`,
            expected: "no fabricated metrics",
            actual: `contains metric "${matches[0]}" not in source`,
          });
          break;
        }
      }
    }
  }

  return violations;
}

// ── Main Validation ──────────────────────────────────────────

/**
 * Validate that the optimized resume preserves all factual data
 * from the source resume. Returns violation metadata for
 * change-tracking purposes.
 */
export function validateFactualPreservation(
  source: ResumeSnapshot,
  optimized: ResumeSnapshot,
): FactualValidationResult {
  // First apply the deterministic overlay
  const safe = overlayImmutableFields(source, optimized);

  // Then detect remaining violations (fabricated metrics, etc.)
  const violations: FactualViolation[] = [
    ...detectImmutableViolations(source, safe),
    ...containsFabricatedMetrics(safe, source),
  ];

  return {
    valid: violations.length === 0,
    violations,
  };
}
