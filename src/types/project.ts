// ── Project snapshot ──────────────────────────────────────

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl: string | null;
  playstoreUrl: string | null;
  appstoreUrl: string | null;
  gitUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Structured error ──────────────────────────────────────

export interface ProjectError {
  code: ProjectErrorCode;
  message: string;
}

export type ProjectErrorCode =
  | "authentication_required"
  | "project_not_found"
  | "validation_error"
  | "unexpected";

// ── Generic result type ───────────────────────────────────

export type ProjectOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ProjectError };
