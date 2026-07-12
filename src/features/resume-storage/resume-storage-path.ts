// ─────────────────────────────────────────────────────────────
// Storage path generation
// ─────────────────────────────────────────────────────────────
// Generates deterministic, owner-scoped storage paths.
// Path format: {userId}/{resumeId}/{filename}
// ─────────────────────────────────────────────────────────────

import { STORAGE_BUCKET } from "@/types/resume-upload";

/**
 * Generate a safe storage path for a resume file.
 * Path is scoped to the authenticated user and resume.
 */
export function buildStoragePath(
  userId: string,
  resumeId: string,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  return `${userId}/${resumeId}/${safeName}`;
}

/**
 * Get the storage bucket name.
 */
export function getStorageBucket(): string {
  return STORAGE_BUCKET;
}

/**
 * Sanitize a filename: strip path separators, preserve only
 * approved extensions, lowercase, and remove special characters.
 */
function sanitizeFileName(fileName: string): string {
  // Strip any path components
  const base = fileName.split("/").pop() ?? fileName;
  const lastSlash = base.lastIndexOf("\\");
  const name = lastSlash >= 0 ? base.slice(lastSlash + 1) : base;

  // Find the extension
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) {
    return normalizeName(name);
  }

  const ext = name.slice(dotIndex).toLowerCase();
  const stem = name.slice(0, dotIndex);

  // Only keep .pdf or .docx extensions
  if (ext !== ".pdf" && ext !== ".docx") {
    return normalizeName(name);
  }

  return `${normalizeName(stem)}${ext}`;
}

/**
 * Normalize a filename stem: lowercase, replace spaces with hyphens,
 * strip anything that isn't alphanumeric, hyphen, or underscore.
 */
function normalizeName(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
