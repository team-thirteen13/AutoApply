// ─────────────────────────────────────────────────────────────
// Storage path generation
// ─────────────────────────────────────────────────────────────
// Generates owner-scoped storage paths with UUID prefix
// for collision resistance.
// Path format: {userId}/{resumeId}/{uuid}-{sanitized-filename}
// ─────────────────────────────────────────────────────────────

import { STORAGE_BUCKET } from "@/types/resume-upload";

/**
 * Generate a safe storage path for a resume file.
 * Path is scoped to the authenticated user and resume.
 * Each upload gets a unique UUID prefix for collision resistance.
 */
export function buildStoragePath(
  userId: string,
  resumeId: string,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  const uuid = crypto.randomUUID();
  return `${userId}/${resumeId}/${uuid}-${safeName}`;
}

/**
 * Get the storage bucket name.
 */
export function getStorageBucket(): string {
  return STORAGE_BUCKET;
}

/**
 * Extract display filename from a storage path.
 * Removes the UUID prefix added by buildStoragePath.
 * Handles malformed or legacy paths safely.
 *
 * Example:
 *   "userId/resumeId/550e8400-e29b-41d4-a716-446655440000-resume.pdf" → "resume.pdf"
 *   "userId/resumeId/my-resume.pdf"                                   → "my-resume.pdf"
 */
export function extractDisplayFileName(filePath: string): string {
  // Get the last path segment (the filename)
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  const rawName = lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;

  // UUID format: 8-4-4-4-12 hex chars followed by a hyphen
  // e.g., "550e8400-e29b-41d4-a716-446655440000-"
  const uuidPrefixPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(.+)/i;
  const match = rawName.match(uuidPrefixPattern);
  if (match) {
    return match[1];
  }

  // If no UUID prefix, return as-is (legacy path or no prefix)
  return rawName;
}

/**
 * Sanitize a filename: strip path separators, preserve only
 * approved extensions, lowercase, and remove special characters.
 * Hardened against edge cases:
 * - leading dots (stripped)
 * - path traversal (stripped)
 * - control characters (stripped)
 * - empty stem fallback to "resume"
 */
function sanitizeFileName(fileName: string): string {
  // Strip any path components (handle both / and \)
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
 * strip control characters, strip anything that isn't alphanumeric,
 * hyphen, or underscore. Handles leading dots, empty stems, and
 * repeated whitespace.
 */
function normalizeName(stem: string): string {
  let result = stem
    .toLowerCase()
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "") // strip control characters
    .replace(/\s+/g, "-") // whitespace to hyphens
    .replace(/\./g, "-") // dots to hyphens (for multiple extensions)
    .replace(/[^a-z0-9_-]/g, "") // strip non-safe chars
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // strip leading/trailing hyphens

  // Empty stem fallback
  if (!result) {
    result = "resume";
  }

  return result;
}
