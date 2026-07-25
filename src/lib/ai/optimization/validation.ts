// ─────────────────────────────────────────────────────────────
// Provider Output Runtime Validation
// ─────────────────────────────────────────────────────────────
// Zod schemas for validating provider output before it reaches
// application state. Rejects malformed, incomplete, or
// structurally invalid responses. No `as ResumeSnapshot` casts.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

// ── String length bounds ─────────────────────────────────────

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_PHONE = 50;
const MAX_URL = 2048;
const MAX_TEXT = 5000;
const MAX_BULLET = 1000;
const MAX_SKILL_NAME = 100;
const MAX_ARRAY_ITEMS = 100;

// ── Profile Schema ───────────────────────────────────────────

const profileSchema = z
  .object({
    name: z.string().max(MAX_NAME).optional(),
    title: z.string().max(MAX_NAME).optional(),
    email: z.string().max(MAX_EMAIL).optional(),
    phone: z.string().max(MAX_PHONE).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    address: z.string().max(300).optional(),
    location: z.string().max(300).optional(),
    tagline: z.string().max(300).optional(),
    bio: z.string().max(MAX_TEXT).optional(),
    githubUrl: z.string().max(MAX_URL).optional(),
    linkedinUrl: z.string().max(MAX_URL).optional(),
    portfolioUrl: z.string().max(MAX_URL).optional(),
    photoUrl: z.string().max(MAX_URL).optional(),
  })
  .strict()
  .optional();

// ── Experience Schema ────────────────────────────────────────

const experienceSchema = z
  .object({
    id: z.string().max(100).optional(),
    company: z.string().min(1).max(MAX_NAME),
    title: z.string().min(1).max(MAX_NAME),
    employmentType: z.string().max(50).optional(),
    location: z.string().max(200).optional(),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().max(MAX_TEXT).optional(),
    accomplishments: z
      .array(z.string().max(MAX_BULLET))
      .max(MAX_ARRAY_ITEMS)
      .optional(),
    skills: z
      .array(z.string().max(MAX_SKILL_NAME))
      .max(50)
      .optional(),
  })
  .strict();

// ── Education Schema ─────────────────────────────────────────

const educationSchema = z
  .object({
    id: z.string().max(100).optional(),
    university: z.string().min(1).max(MAX_NAME),
    degree: z.string().min(1).max(MAX_NAME),
    fieldOfStudy: z.string().max(MAX_NAME).optional(),
    location: z.string().max(200).optional(),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    isCurrent: z.boolean().optional(),
    grade: z.string().max(50).optional(),
    description: z.string().max(MAX_TEXT).optional(),
    achievements: z
      .array(z.string().max(MAX_BULLET))
      .max(20)
      .optional(),
  })
  .strict();

// ── Project Schema ───────────────────────────────────────────

const projectSchema = z
  .object({
    id: z.string().max(100).optional(),
    title: z.string().min(1).max(MAX_NAME),
    role: z.string().max(MAX_NAME).optional(),
    description: z.string().max(MAX_TEXT).optional(),
    technologies: z
      .array(z.string().max(MAX_SKILL_NAME))
      .max(30)
      .optional(),
    url: z.string().max(MAX_URL).optional(),
    liveUrl: z.string().max(MAX_URL).optional(),
    gitUrl: z.string().max(MAX_URL).optional(),
    startDate: z.string().max(50).optional(),
    endDate: z.string().max(50).nullable().optional(),
  })
  .strict();

// ── Certificate Schema ───────────────────────────────────────

const certificateSchema = z
  .object({
    id: z.string().max(100).optional(),
    name: z.string().min(1).max(MAX_NAME),
    issuingOrganisation: z.string().max(MAX_NAME).optional(),
    url: z.string().max(MAX_URL).optional(),
    credentialId: z.string().max(200).optional(),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    doesNotExpire: z.boolean().optional(),
  })
  .strict();

// ── Skill Schema ─────────────────────────────────────────────

const skillSchema = z
  .object({
    id: z.string().max(100).optional(),
    name: z.string().min(1).max(MAX_SKILL_NAME),
    category: z.string().max(100),
    proficiency: z.string().max(100),
  })
  .strict();

// ── Language Schema ──────────────────────────────────────────

const languageSchema = z
  .object({
    id: z.string().max(100).optional(),
    name: z.string().min(1).max(100),
    proficiency: z.string().max(100).optional(),
  })
  .strict();

// ── ResumeSnapshot Schema ────────────────────────────────────

export const resumeSnapshotSchema = z
  .object({
    templateId: z.enum(["classic", "modern", "minimal"]).optional(),
    profile: profileSchema,
    summary: z.string().max(MAX_TEXT).optional(),
    experiences: z.array(experienceSchema).max(MAX_ARRAY_ITEMS).optional(),
    projects: z.array(projectSchema).max(MAX_ARRAY_ITEMS).optional(),
    education: z.array(educationSchema).max(50).optional(),
    certificates: z.array(certificateSchema).max(50).optional(),
    skills: z.array(skillSchema).max(100).optional(),
    languages: z.array(languageSchema).max(30).optional(),
  })
  .strict();

// ── Change Metadata Schema ───────────────────────────────────

const VALID_REASONS = [
  "keyword_alignment",
  "action_verbs",
  "conciseness",
  "tense_consistency",
  "terminology",
  "readability",
  "filler_removal",
  "skill_organization",
  "summary_relevance",
  "bullet_clarity",
] as const;

const changeSchema = z
  .object({
    section: z.string().min(1).max(50),
    field: z.string().min(1).max(200),
    originalValue: z.string().max(5000),
    optimizedValue: z.string().max(5000),
    reason: z.enum(VALID_REASONS),
  })
  .strict();

// ── Provider Envelope Schema ─────────────────────────────────

export const providerOutputSchema = z
  .object({
    optimizedResume: resumeSnapshotSchema,
    changes: z.array(changeSchema).max(200).optional(),
    warnings: z.array(z.string().max(500)).max(50).optional(),
  })
  .strict();

// ── Types ────────────────────────────────────────────────────

export type ValidatedProviderOutput = z.infer<typeof providerOutputSchema>;

// ── Validation Helper ────────────────────────────────────────

export interface ValidationResult {
  valid: true;
  data: ValidatedProviderOutput;
}

export interface ValidationFailure {
  valid: false;
  errors: string[];
}

export type ValidationResultOutcome = ValidationResult | ValidationFailure;

/**
 * Validate raw provider output against the expected schema.
 * Returns typed data on success, or an error list on failure.
 * Never returns partial data — it's all-or-nothing.
 */
export function validateProviderOutput(
  raw: unknown,
): ValidationResultOutcome {
  // Guard against prototype pollution
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return {
      valid: false,
      errors: ["Provider output must be a non-null object."],
    };
  }

  // Reject prototype-bearing objects
  const proto = Object.getPrototypeOf(raw);
  if (proto !== null && proto !== Object.prototype) {
    return {
      valid: false,
      errors: ["Provider output has unexpected prototype."],
    };
  }

  const result = providerOutputSchema.safeParse(raw);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  return { valid: false, errors };
}
