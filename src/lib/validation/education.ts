import { z } from "zod";
import { isoDateSchema } from "./experience";

// ── ID validation ─────────────────────────────────────────

export const educationIdSchema = z.string().uuid("Invalid education ID");

export type EducationIdInput = z.infer<typeof educationIdSchema>;

// ── Create input validation ───────────────────────────────

export const createEducationSchema = z
  .object({
    university: z.string().trim().min(1, "University is required").max(200),
    degree: z.string().trim().min(1, "Degree is required").max(200),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.endDate == null) return true;
      return data.endDate >= data.startDate;
    },
    { message: "End date must be on or after start date", path: ["endDate"] },
  );

export type CreateEducationInput = z.infer<typeof createEducationSchema>;

// ── Update input validation ───────────────────────────────

export const updateEducationSchema = z
  .object({
    university: z.string().trim().min(1, "University is required").max(200).optional(),
    degree: z.string().trim().min(1, "Degree is required").max(200).optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" },
  );

export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
