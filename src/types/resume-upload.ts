// ─────────────────────────────────────────────────────────────
// Resume Upload types
// ─────────────────────────────────────────────────────────────
// Domain types for resume file upload, retrieval, and deletion.
// Files are stored in Supabase Storage under a private bucket.
// ─────────────────────────────────────────────────────────────

// ── Allowed file types ──────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

// ── File size limits ────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Storage config ──────────────────────────────────────────

export const STORAGE_BUCKET = "resume-files" as const;

// ── Upload result ───────────────────────────────────────────

export interface ResumeUploadResult {
  filePath: string;
  contentType: string;
  size: number;
}

// ── Error handling ──────────────────────────────────────────

export interface ResumeUploadError {
  code: ResumeUploadErrorCode;
  message: string;
}

export type ResumeUploadErrorCode =
  | "authentication_required"
  | "resume_not_found"
  | "invalid_file_type"
  | "file_too_large"
  | "empty_file"
  | "upload_failed"
  | "not_found"
  | "validation_error"
  | "unexpected";

export type ResumeUploadOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ResumeUploadError };
