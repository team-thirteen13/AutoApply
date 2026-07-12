// ─────────────────────────────────────────────────────────────
// Profile Validation Schemas
// ─────────────────────────────────────────────────────────────
// Zod schemas for profile updates.
// Validates before calling Supabase to fail fast on bad input.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    phone: z.string().trim().min(1, "Phone is required").max(50),
    location: z.string().trim().min(1, "Location is required").max(200),
    githubUrl: z.string().url("Invalid URL").max(512).nullable(),
    linkedinUrl: z.string().url("Invalid URL").max(512).nullable(),
    portfolioUrl: z.string().url("Invalid URL").max(512).nullable(),
    tagline: z.string().max(300).nullable(),
    bio: z.string().max(2000).nullable(),
    imageUrl: z.string().url("Invalid URL").max(512).nullable(),
  })
  .partial()
  .strict()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
