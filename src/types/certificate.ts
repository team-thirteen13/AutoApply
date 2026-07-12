// ── Certificate snapshot ──────────────────────────────────

export interface Certificate {
  id: string;
  userId: string;
  name: string;
  url: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Structured error ──────────────────────────────────────

export interface CertificateError {
  code: CertificateErrorCode;
  message: string;
}

export type CertificateErrorCode =
  | "authentication_required"
  | "certificate_not_found"
  | "validation_error"
  | "unexpected";

// ── Generic result type ───────────────────────────────────

export type CertificateOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: CertificateError };
