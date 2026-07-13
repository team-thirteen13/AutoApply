// ─────────────────────────────────────────────────────────────
// Template Normalization
// ─────────────────────────────────────────────────────────────
// Normalizes templateId in snapshots at load boundary.
// Handles legacy snapshots without templateId safely.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";
import type { ResumeTemplateId } from "./types";
import { DEFAULT_TEMPLATE_ID, isValidTemplateId } from "./registry";

/**
 * Normalize templateId in a ResumeSnapshot.
 * - Missing templateId → defaults to "classic"
 * - Invalid templateId → defaults to "classic"
 * - Valid templateId → preserved
 * - Returns a new snapshot (no mutation)
 */
export function normalizeSnapshotTemplate<T extends ResumeSnapshot>(snapshot: T): T {
  const raw = (snapshot as Record<string, unknown>).templateId;

  if (typeof raw === "string" && isValidTemplateId(raw)) {
    // Already valid, no change needed
    return snapshot;
  }

  // Default to classic for missing or invalid templateId
  return {
    ...snapshot,
    templateId: DEFAULT_TEMPLATE_ID,
  };
}

/**
 * Get the effective template ID from a snapshot.
 * Returns a valid ResumeTemplateId, falling back to default.
 */
export function getEffectiveTemplateId(templateId: unknown): ResumeTemplateId {
  if (typeof templateId === "string" && isValidTemplateId(templateId)) {
    return templateId;
  }
  return DEFAULT_TEMPLATE_ID;
}
