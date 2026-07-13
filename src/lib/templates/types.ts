// ─────────────────────────────────────────────────────────────
// Template Types
// ─────────────────────────────────────────────────────────────
// Type definitions for the resume template system.
// ─────────────────────────────────────────────────────────────

/**
 * Stable template identifiers. No arbitrary user-provided IDs.
 */
export type ResumeTemplateId = "classic" | "modern" | "minimal";

/**
 * Template metadata for the registry and UI.
 */
export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  /** CSS class or inline style for thumbnail preview */
  thumbnailStyle: React.CSSProperties;
}
