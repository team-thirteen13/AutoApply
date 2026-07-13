// ─────────────────────────────────────────────────────────────
// Template Registry
// ─────────────────────────────────────────────────────────────
// Canonical registry of all available resume templates.
// One source of truth — no duplicated metadata across components.
// ─────────────────────────────────────────────────────────────

import type { ResumeTemplate, ResumeTemplateId } from "./types";

/**
 * Default template for new resumes and legacy snapshots.
 * "classic" matches the existing resume appearance.
 */
export const DEFAULT_TEMPLATE_ID: ResumeTemplateId = "classic";

/**
 * All available templates in display order.
 */
export const TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional professional layout with clear sections",
    thumbnailStyle: {
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      borderColor: "#94a3b8",
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean design with accent colors and sidebar",
    thumbnailStyle: {
      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      borderColor: "#3b82f6",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant with minimal styling",
    thumbnailStyle: {
      background: "#ffffff",
      borderColor: "#e5e7eb",
    },
  },
];

/**
 * Lookup a template by ID. Returns undefined for invalid IDs.
 */
export function getTemplate(id: ResumeTemplateId | undefined): ResumeTemplate | undefined {
  if (!id) return undefined;
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Resolve a template ID to a valid template, falling back to default.
 */
export function resolveTemplate(id: ResumeTemplateId | undefined): ResumeTemplate {
  return getTemplate(id) ?? TEMPLATES[0];
}

/**
 * Check if a string is a valid template ID.
 */
export function isValidTemplateId(id: string): id is ResumeTemplateId {
  return TEMPLATES.some((t) => t.id === id);
}
