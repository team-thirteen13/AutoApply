// ─────────────────────────────────────────────────────────────
// Experience Validation Schemas
// ─────────────────────────────────────────────────────────────
// Zod schemas for experience operation inputs.
// Single source of truth for input types.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Experience ID ───────────────────────────────────────────

export const experienceIdSchema = z
  .string()
  .uuid("Invalid experience ID");

export type ExperienceIdInput = z.infer<typeof experienceIdSchema>;
