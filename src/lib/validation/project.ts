import { z } from "zod";

// ── ID validation ─────────────────────────────────────────

export const projectIdSchema = z.string().uuid("Invalid project ID");

export type ProjectIdInput = z.infer<typeof projectIdSchema>;

// ── URL validation ────────────────────────────────────────

const urlSchema = z.string().url("Must be a valid URL");

// ── Create input validation ───────────────────────────────

export const createProjectSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().min(1, "Description is required").max(2000),
    technologies: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .optional(),
    liveUrl: urlSchema.nullable().optional(),
    playstoreUrl: urlSchema.nullable().optional(),
    appstoreUrl: urlSchema.nullable().optional(),
    gitUrl: urlSchema.nullable().optional(),
    imageUrl: urlSchema.nullable().optional(),
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ── Update input validation ───────────────────────────────

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(2000)
      .optional(),
    technologies: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .optional(),
    liveUrl: urlSchema.nullable().optional(),
    playstoreUrl: urlSchema.nullable().optional(),
    appstoreUrl: urlSchema.nullable().optional(),
    gitUrl: urlSchema.nullable().optional(),
    imageUrl: urlSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" },
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
