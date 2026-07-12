import { z } from "zod";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/types/resume-upload";

// ── Resume ID validation ────────────────────────────────────

export const resumeUploadIdSchema = z.string().uuid("Invalid resume ID");

export type ResumeUploadIdInput = z.infer<typeof resumeUploadIdSchema>;

// ── File validation ─────────────────────────────────────────

export function validateResumeFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file is not empty
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: PDF, DOCX`,
    };
  }

  // Check extension
  const name = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true };
}
