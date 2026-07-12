import { z } from "zod";

// ── Skill ID validation ───────────────────────────────────

export const skillIdSchema = z.string().uuid("Invalid skill ID");

export type SkillIdInput = z.infer<typeof skillIdSchema>;
