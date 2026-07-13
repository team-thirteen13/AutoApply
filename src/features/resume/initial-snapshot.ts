// ─────────────────────────────────────────────────────────────
// Initial Resume Snapshot
// ─────────────────────────────────────────────────────────────
// Canonical empty snapshot for newly created resumes.
// Compatible with Phase 3 validation and Phase 4 templates.
// Used by the create-resume action to ensure every resume
// starts with a valid, non-empty snapshot structure.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

/**
 * Valid initial snapshot for a new resume.
 * - templateId: "classic" (Phase 4 default)
 * - skills: [] (object-form, Phase 3 compatible)
 * - All optional sections present as empty arrays/objects
 */
export const INITIAL_SNAPSHOT: ResumeSnapshot = {
  templateId: "classic",
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  certificates: [],
  languages: [],
};
