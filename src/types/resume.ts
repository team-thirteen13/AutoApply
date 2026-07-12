// ─────────────────────────────────────────────────────────────
// Resume types
// ─────────────────────────────────────────────────────────────
// Domain types for the resume module.
// A resume is a named presentation of career data.
// A version is a point-in-time snapshot of that data.
// ─────────────────────────────────────────────────────────────

// ── Resume snapshot (stored as JSONB in resume_versions) ─────

export interface ResumeSnapshot {
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    tagline?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  experiences?: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    accomplishments?: string[];
    skills?: string[];
  }>;
  projects?: Array<{
    title: string;
    description?: string;
    technologies?: string[];
    liveUrl?: string;
    gitUrl?: string;
  }>;
  education?: Array<{
    university: string;
    degree: string;
    startDate: string;
    endDate?: string | null;
  }>;
  certificates?: Array<{
    name: string;
    url?: string;
    startDate: string;
    endDate?: string | null;
  }>;
  skills?: string[];
}

// ── Resume ──────────────────────────────────────────────────

export interface Resume {
  id: string;
  userId: string;
  title: string;
  targetRole: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Resume version ──────────────────────────────────────────

export interface ResumeVersion {
  id: string;
  resumeId: string;
  userId: string;
  snapshot: ResumeSnapshot;
  label: string | null;
  createdAt: string;
}

// ── Error handling ──────────────────────────────────────────

export interface ResumeError {
  code: ResumeErrorCode;
  message: string;
}

export type ResumeErrorCode =
  | "authentication_required"
  | "resume_not_found"
  | "version_not_found"
  | "validation_error"
  | "unexpected";

export type ResumeOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ResumeError };
