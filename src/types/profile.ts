// ─────────────────────────────────────────────────────────────
// Profile Types
// ─────────────────────────────────────────────────────────────
// Shared type contracts for profile operations.
// Used by profile services and consumed by UI (Member 2).
// ─────────────────────────────────────────────────────────────

// ── Profile snapshot ───────────────────────────────────────

export interface Profile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  tagline: string | null;
  bio: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Structured error (for operation results) ────────────────

export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
}

export type ProfileErrorCode =
  | "authentication_required"
  | "profile_not_found"
  | "validation_error"
  | "unexpected";

// ── Generic result type ─────────────────────────────────────

export type ProfileOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ProfileError };
