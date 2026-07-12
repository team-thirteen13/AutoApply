import { z } from "zod";

// ── ID validation ───────────────────────────────────────────

export const resumeIdSchema = z.string().uuid("Invalid resume ID");

export type ResumeIdInput = z.infer<typeof resumeIdSchema>;

// ── Create resume validation ────────────────────────────────

export const createResumeSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    targetRole: z.string().trim().min(1).max(200).nullable().optional(),
  })
  .strict();

export type CreateResumeInput = z.infer<typeof createResumeSchema>;

// ── Update resume validation ────────────────────────────────

export const updateResumeSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    targetRole: z.string().trim().min(1).max(200).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;

// ── Create version validation ───────────────────────────────

export const createVersionSchema = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type CreateVersionInput = z.infer<typeof createVersionSchema>;

// ── Version ID validation ───────────────────────────────────

export const versionIdSchema = z.string().uuid("Invalid version ID");

export type VersionIdInput = z.infer<typeof versionIdSchema>;
