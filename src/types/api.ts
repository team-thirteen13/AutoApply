// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────
// Shared type contracts for API route responses.
// Ensures consistent response shape across all endpoints.
// ─────────────────────────────────────────────────────────────

// ── Success response ────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

// ── Error response ──────────────────────────────────────────

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ── Union type ──────────────────────────────────────────────

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── HTTP status codes ──────────────────────────────────────

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
