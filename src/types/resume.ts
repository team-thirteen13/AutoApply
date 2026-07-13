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
    title?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    location?: string;
    tagline?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    photoUrl?: string;
  };
  summary?: string;
  experiences?: Array<{
    id?: string;
    company: string;
    title: string;
    employmentType?: string;
    location?: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string;
    accomplishments?: string[];
    skills?: string[];
  }>;
  projects?: Array<{
    id?: string;
    title: string;
    role?: string;
    description?: string;
    technologies?: string[];
    url?: string;
    liveUrl?: string;
    gitUrl?: string;
    startDate?: string;
    endDate?: string | null;
  }>;
  education?: Array<{
    id?: string;
    university: string;
    degree: string;
    fieldOfStudy?: string;
    location?: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
    achievements?: string[];
  }>;
  certificates?: Array<{
    id?: string;
    name: string;
    issuingOrganisation?: string;
    url?: string;
    credentialId?: string;
    startDate: string;
    endDate?: string | null;
    doesNotExpire?: boolean;
  }>;
  skills?: Array<{
    id?: string;
    name: string;
    category: string;
    proficiency: string;
  }>;
  languages?: Array<{
    id?: string;
    name: string;
    proficiency?: string;
  }>;
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
