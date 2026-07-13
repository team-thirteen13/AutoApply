// ─────────────────────────────────────────────────────────────
// AI Validation Schemas
// ─────────────────────────────────────────────────────────────
// Zod schemas for AI generation requests.
// Validates before calling provider to fail fast on bad input.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Profile schema (optional nested) ────────────────────────

const aiProfileSchema = z
  .object({
    name: z.string().trim().max(200).optional(),
    title: z.string().trim().max(200).optional(),
    email: z.string().email().max(200).optional(),
    phone: z.string().trim().max(50).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    bio: z.string().max(5000).optional(),
    githubUrl: z.string().url().max(512).optional(),
    linkedinUrl: z.string().url().max(512).optional(),
    portfolioUrl: z.string().url().max(512).optional(),
  })
  .strict()
  .optional();

// ── Experience schema (array, optional) ─────────────────────

const aiExperienceSchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().max(2000).optional(),
    accomplishments: z.array(z.string().max(1000)).max(20).optional(),
    skills: z.array(z.string().max(100)).max(50).optional(),
  })
  .strict();

// ── Education schema (array, optional) ──────────────────────

const aiEducationSchema = z
  .object({
    university: z.string().trim().min(1).max(200),
    degree: z.string().trim().min(1).max(200),
    fieldOfStudy: z.string().trim().max(200).optional(),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    isCurrent: z.boolean().optional(),
    grade: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
  })
  .strict();

// ── Project schema (array, optional) ────────────────────────

const aiProjectSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    technologies: z.array(z.string().max(100)).max(30).optional(),
    url: z.string().url().max(512).optional(),
    liveUrl: z.string().url().max(512).optional(),
    gitUrl: z.string().url().max(512).optional(),
    startDate: z.string().max(50).optional(),
    endDate: z.string().max(50).nullable().optional(),
  })
  .strict();

// ── Certificate schema (array, optional) ────────────────────

const aiCertificateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    issuingOrganisation: z.string().trim().max(200).optional(),
    url: z.string().url().max(512).optional(),
    credentialId: z.string().max(200).optional(),
    startDate: z.string().min(1).max(50),
    endDate: z.string().max(50).nullable().optional(),
    doesNotExpire: z.boolean().optional(),
  })
  .strict();

// ── Generate resume schema ──────────────────────────────────

export const generateResumeSchema = z
  .object({
    profile: aiProfileSchema,
    experiences: z.array(aiExperienceSchema).max(50).optional(),
    education: z.array(aiEducationSchema).max(20).optional(),
    projects: z.array(aiProjectSchema).max(30).optional(),
    certificates: z.array(aiCertificateSchema).max(20).optional(),
    skills: z.array(z.string().max(100)).max(100).optional(),
    targetRole: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Require at least one section to have data
      return (
        data.profile !== undefined ||
        (data.experiences !== undefined && data.experiences.length > 0) ||
        (data.education !== undefined && data.education.length > 0) ||
        (data.projects !== undefined && data.projects.length > 0) ||
        (data.certificates !== undefined && data.certificates.length > 0) ||
        (data.skills !== undefined && data.skills.length > 0) ||
        data.targetRole !== undefined
      );
    },
    { message: "At least one section must contain data" },
  );

export type GenerateResumeSchemaInput = z.infer<typeof generateResumeSchema>;
