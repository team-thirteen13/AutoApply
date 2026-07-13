import { z } from "zod";
import { isoDateSchema } from "./experience";

// ─────────────────────────────────────────────────────────────
// Builder Section Validation Schemas
// ─────────────────────────────────────────────────────────────
// Zod schemas for validating each resume builder section.
// Used for:
//  - Section completion validation
//  - Full snapshot validation before save
//  - Inline error display in form components
//
// Required rules are reasonable and match existing product behavior.
// Fields not marked required are optional in the builder UI.
// ─────────────────────────────────────────────────────────────

// ── Personal Information ───────────────────────────────────

export const personalInfoSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(200),
  title: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  location: z.string().max(200).optional(),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  githubUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  photoUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

// ── Professional Summary ───────────────────────────────────

export const summarySchema = z.object({
  summary: z.string().max(2000).optional(),
});

export type SummaryInput = z.infer<typeof summarySchema>;

// ── Experience Entry ───────────────────────────────────────

export const experienceEntrySchema = z.object({
  id: z.string().optional(),
  company: z.string().trim().min(1, "Company is required").max(200),
  title: z.string().trim().min(1, "Title is required").max(200),
  employmentType: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(1000).optional(),
  accomplishments: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
}).refine(
  (data) => !(data.isCurrent === true && data.endDate != null),
  { message: "End date must be null when is current", path: ["endDate"] },
).refine(
  (data) => {
    if (data.endDate == null) return true;
    return data.endDate >= data.startDate;
  },
  { message: "End date must be on or after start date", path: ["endDate"] },
);

export type ExperienceEntryInput = z.infer<typeof experienceEntrySchema>;

export const experienceSectionSchema = z.array(experienceEntrySchema);

// ── Education Entry ────────────────────────────────────────

export const educationEntrySchema = z.object({
  id: z.string().optional(),
  university: z.string().trim().min(1, "University is required").max(200),
  degree: z.string().trim().min(1, "Degree is required").max(200),
  fieldOfStudy: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable().optional(),
  isCurrent: z.boolean().optional(),
  grade: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  achievements: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
}).refine(
  (data) => {
    if (data.endDate == null) return true;
    return data.endDate >= data.startDate;
  },
  { message: "End date must be on or after start date", path: ["endDate"] },
);

export type EducationEntryInput = z.infer<typeof educationEntrySchema>;

export const educationSectionSchema = z.array(educationEntrySchema);

// ── Skills Entry ───────────────────────────────────────────

export const skillEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Skill name is required").max(100),
  category: z.string().max(100).optional(),
  proficiency: z.string().max(100).optional(),
});

export type SkillEntryInput = z.infer<typeof skillEntrySchema>;

export const skillsSectionSchema = z.array(skillEntrySchema);

// ── Projects Entry ─────────────────────────────────────────

export const projectEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(200),
  role: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  technologies: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  liveUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  gitUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.nullable().optional(),
}).refine(
  (data) => {
    if (data.endDate == null || data.startDate == null) return true;
    return data.endDate >= data.startDate;
  },
  { message: "End date must be on or after start date", path: ["endDate"] },
);

export type ProjectEntryInput = z.infer<typeof projectEntrySchema>;

export const projectsSectionSchema = z.array(projectEntrySchema);

// ── Certifications Entry ───────────────────────────────────

export const certificationEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(200),
  issuingOrganisation: z.string().max(200).optional(),
  url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  credentialId: z.string().max(200).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable().optional(),
  doesNotExpire: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.doesNotExpire) return true;
    if (data.endDate == null) return true;
    return data.endDate >= data.startDate;
  },
  { message: "End date must be on or after start date", path: ["endDate"] },
);

export type CertificationEntryInput = z.infer<typeof certificationEntrySchema>;

export const certificationsSectionSchema = z.array(certificationEntrySchema);

// ── Languages Entry ────────────────────────────────────────

export const languageEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Language name is required").max(100),
  proficiency: z.string().max(100).optional(),
});

export type LanguageEntryInput = z.infer<typeof languageEntrySchema>;

export const languagesSectionSchema = z.array(languageEntrySchema);

// ── Full Snapshot Validation ───────────────────────────────

export const resumeSnapshotSchema = z.object({
  profile: personalInfoSchema.partial().optional(),
  summary: z.string().max(2000).optional(),
  experiences: experienceSectionSchema.optional(),
  education: educationSectionSchema.optional(),
  skills: skillsSectionSchema.optional(),
  projects: projectsSectionSchema.optional(),
  certificates: certificationsSectionSchema.optional(),
  languages: languagesSectionSchema.optional(),
});

export type ResumeSnapshotInput = z.infer<typeof resumeSnapshotSchema>;

// ── Section ID Type ────────────────────────────────────────

export type BuilderSectionId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages";

// ── Section Validation Schemas Map ─────────────────────────

export const sectionSchemas = {
  personal: personalInfoSchema,
  summary: summarySchema,
  experience: experienceSectionSchema,
  education: educationSectionSchema,
  skills: skillsSectionSchema,
  projects: projectsSectionSchema,
  certifications: certificationsSectionSchema,
  languages: languagesSectionSchema,
} as const;

// ── Validation Helpers ─────────────────────────────────────

export interface SectionValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate a single section's data against its schema.
 * Returns field-level errors as a flat record.
 */
export function validateSection(
  sectionId: BuilderSectionId,
  data: unknown,
): SectionValidationResult {
  const schema = sectionSchemas[sectionId];
  if (!schema) {
    return { valid: true, errors: {} };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path && !errors[path]) {
      errors[path] = issue.message;
    } else if (!path) {
      errors._form = issue.message;
    }
  }

  return { valid: false, errors };
}

/**
 * Validate all sections and return the first invalid section ID.
 * Returns null if all sections are valid.
 */
export function findFirstInvalidSection(
  snapshot: Record<string, unknown>,
): BuilderSectionId | null {
  const sectionOrder: BuilderSectionId[] = [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
  ];

  for (const sectionId of sectionOrder) {
    const data = getSectionData(snapshot, sectionId);
    const result = validateSection(sectionId, data);
    if (!result.valid) {
      return sectionId;
    }
  }

  return null;
}

/**
 * Get section data from a snapshot object.
 */
function getSectionData(
  snapshot: Record<string, unknown>,
  sectionId: BuilderSectionId,
): unknown {
  switch (sectionId) {
    case "personal":
      return snapshot.profile ?? {};
    case "summary":
      return { summary: snapshot.summary ?? "" };
    case "experience":
      return snapshot.experiences ?? [];
    case "education":
      return snapshot.education ?? [];
    case "skills":
      return snapshot.skills ?? [];
    case "projects":
      return snapshot.projects ?? [];
    case "certifications":
      return snapshot.certificates ?? [];
    case "languages":
      return snapshot.languages ?? [];
    default:
      return {};
  }
}
