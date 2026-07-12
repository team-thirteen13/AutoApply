import { z } from "zod";

// ── Shared validators ───────────────────────────────────────

/**
 * Strict ISO calendar date (YYYY-MM-DD).
 * Rejects impossible dates like 2026-02-30 or 2025-02-29.
 * Supported year range: 1000–9999.
 */
export const isoDateSchema = z.string().refine((val) => {
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, yStr, mStr, dStr] = match;
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}, "Invalid date");

/**
 * Shared array of trimmed non-empty strings.
 * Maximum 50 items, each max 500 characters.
 */
export const experienceStringArraySchema = z
  .array(z.string().trim().min(1, "Array items must not be empty").max(500))
  .max(50);

// ── ID validation ───────────────────────────────────────────

export const experienceIdSchema = z
  .string()
  .uuid("Invalid experience ID");

export type ExperienceIdInput = z.infer<typeof experienceIdSchema>;

// ── Create input validation ─────────────────────────────────

export const createExperienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(200),
    title: z.string().trim().min(1, "Title is required").max(200),
    companyUrl: z.string().trim().url("Invalid URL").max(512).nullable().optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable().optional(),
    isCurrent: z.boolean().optional(),
    accomplishments: experienceStringArraySchema.optional(),
    skills: experienceStringArraySchema.optional(),
  })
  .strict()
  .refine(
    (data) => !(data.isCurrent === true && data.endDate != null),
    { message: "End date must be null when is current", path: ["endDate"] },
  )
  .refine(
    (data) => {
      if (data.endDate == null) return true;
      return data.endDate >= data.startDate;
    },
    { message: "End date must be on or after start date", path: ["endDate"] },
  );

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
