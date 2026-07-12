// ─────────────────────────────────────────────────────────────
// Experience Types
// ─────────────────────────────────────────────────────────────
// Shared type contracts for experience operations.
// Used by experience services and consumed by UI (Member 2).
// ─────────────────────────────────────────────────────────────

// ── Experience snapshot ─────────────────────────────────────

export interface Experience {
  id: string;
  userId: string;
  company: string;
  title: string;
  companyUrl: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  accomplishments: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Structured error (for operation results) ────────────────

export interface ExperienceError {
  code: ExperienceErrorCode;
  message: string;
}

export type ExperienceErrorCode =
  | "authentication_required"
  | "experience_not_found"
  | "validation_error"
  | "unexpected";

// ── Generic result type ─────────────────────────────────────

export type ExperienceOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ExperienceError };
