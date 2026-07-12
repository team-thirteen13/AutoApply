// ─────────────────────────────────────────────────────────────
// Experience Mapping Utilities
// ─────────────────────────────────────────────────────────────
// Explicit camelCase ↔ snake_case mapping for experiences.
// Database rows use snake_case; public types use camelCase.
// ─────────────────────────────────────────────────────────────

import type { Experience } from "@/types/experience";

// ── Database row type ───────────────────────────────────────

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

// ── Explicit column selection ───────────────────────────────

export const EXPERIENCE_COLUMNS =
  "id, user_id, company, title, company_url, start_date, end_date, is_current, accomplishments, skills, created_at, updated_at";

// ── snake_case → camelCase ──────────────────────────────────

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
