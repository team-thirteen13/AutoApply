import type { Resume, ResumeVersion, ResumeSnapshot } from "@/types/resume";
import type {
  CreateResumeInput,
  UpdateResumeInput,
} from "@/lib/validation/resume";

// ─────────────────────────────────────────────────────────────
// Resume row mapping
// ─────────────────────────────────────────────────────────────
// Explicit snake_case ↔ camelCase mapping for resume data.
// Prevents Supabase column-name leakage into domain types.
// ─────────────────────────────────────────────────────────────

// ── Database row ────────────────────────────────────────────

export type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  target_role: string | null;
  created_at: string;
  updated_at: string;
};

// ── Explicit column selection ────────────────────────────────

export const RESUME_COLUMNS =
  "id, user_id, title, target_role, created_at, updated_at";

// ── Row → domain ────────────────────────────────────────────

export function toResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetRole: row.target_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Domain → insert row ─────────────────────────────────────

export type ResumeInsertRow = {
  user_id: string;
  title: string;
  target_role?: string | null;
};

/**
 * Maps validated create input to a Supabase insert row.
 *
 * - userId comes only from requireAuthenticatedUser()
 * - undefined properties are omitted (database defaults apply)
 * - explicit null values are preserved
 * - id, created_at, and updated_at are never included
 */
export function toResumeInsert(
  input: CreateResumeInput,
  userId: string,
): ResumeInsertRow {
  return {
    user_id: userId,
    title: input.title,
    ...(input.targetRole !== undefined && { target_role: input.targetRole }),
  };
}

// ── Domain → update row ─────────────────────────────────────

export type ResumeUpdateRow = {
  title?: string;
  target_role?: string | null;
};

/**
 * Maps validated update input to a Supabase update row.
 *
 * - Includes only fields whose value is not undefined
 * - Preserves explicit null values
 * - Never includes user_id, id, created_at, or updated_at
 * - Returned object contains no undefined values
 */
export function toResumeUpdate(input: UpdateResumeInput): ResumeUpdateRow {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.targetRole !== undefined && { target_role: input.targetRole }),
  };
}

// ─────────────────────────────────────────────────────────────
// Resume version row mapping
// ─────────────────────────────────────────────────────────────

// ── Database row ────────────────────────────────────────────

export type ResumeVersionRow = {
  id: string;
  resume_id: string;
  user_id: string;
  snapshot: ResumeSnapshot;
  label: string | null;
  created_at: string;
};

// ── Explicit column selection ────────────────────────────────

export const RESUME_VERSION_COLUMNS =
  "id, resume_id, user_id, snapshot, label, created_at";

// ── Row → domain ────────────────────────────────────────────

export function toResumeVersion(row: ResumeVersionRow): ResumeVersion {
  return {
    id: row.id,
    resumeId: row.resume_id,
    userId: row.user_id,
    snapshot: row.snapshot,
    label: row.label,
    createdAt: row.created_at,
  };
}
