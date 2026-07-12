// ── Education snapshot ─────────────────────────────────────

export interface Education {
  id: string;
  userId: string;
  university: string;
  degree: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Structured error ──────────────────────────────────────

export interface EducationError {
  code: EducationErrorCode;
  message: string;
}

export type EducationErrorCode =
  | "authentication_required"
  | "education_not_found"
  | "validation_error"
  | "unexpected";

// ── Generic result type ───────────────────────────────────

export type EducationOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: EducationError };
