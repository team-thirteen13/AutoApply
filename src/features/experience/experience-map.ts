import type { Experience } from "@/types/experience";
import type { CreateExperienceInput } from "@/lib/validation/experience";

// ─────────────────────────────────────────────────────────────
// Experience row mapping
// ─────────────────────────────────────────────────────────────
// Explicit snake_case ↔ camelCase mapping for experience data.
// Prevents Supabase column-name leakage into domain types.
// ─────────────────────────────────────────────────────────────

// ── Database row ────────────────────────────────────────────

export type ExperienceRow = {
  id: string;
  user_id: string;
  company: string;
  title: string;
  company_url: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  accomplishments: string[];
  skills: string[];
  created_at: string;
  updated_at: string;
};

// ── Explicit column selection ────────────────────────────────

export const EXPERIENCE_COLUMNS =
  "id, user_id, company, title, company_url, start_date, end_date, is_current, accomplishments, skills, created_at, updated_at";

// ── Row → domain ────────────────────────────────────────────

export function toExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    userId: row.user_id,
    company: row.company,
    title: row.title,
    companyUrl: row.company_url,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    accomplishments: row.accomplishments,
    skills: row.skills,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Domain → insert row ─────────────────────────────────────

export type ExperienceInsertRow = {
  user_id: string;
  company: string;
  title: string;
  company_url?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  accomplishments?: string[];
  skills?: string[];
};

/**
 * Maps validated create input to a Supabase insert row.
 *
 * - userId comes only from requireAuthenticatedUser()
 * - undefined properties are omitted (database defaults apply)
 * - explicit null values are preserved
 * - id, created_at, and updated_at are never included
 */
export function toExperienceInsert(
  input: CreateExperienceInput,
  userId: string,
): ExperienceInsertRow {
  return {
    user_id: userId,
    company: input.company,
    title: input.title,
    ...(input.companyUrl !== undefined && { company_url: input.companyUrl }),
    start_date: input.startDate,
    ...(input.endDate !== undefined && { end_date: input.endDate }),
    ...(input.isCurrent !== undefined && { is_current: input.isCurrent }),
    ...(input.accomplishments !== undefined && { accomplishments: input.accomplishments }),
    ...(input.skills !== undefined && { skills: input.skills }),
  };
}
