import type { Education } from "@/types/education";
import type {
  CreateEducationInput,
  UpdateEducationInput,
} from "@/lib/validation/education";

// ── Database row ──────────────────────────────────────────

export type EducationRow = {
  id: string;
  user_id: string;
  university: string;
  degree: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

// ── Explicit column selection ──────────────────────────────

export const EDUCATION_COLUMNS =
  "id, user_id, university, degree, start_date, end_date, created_at, updated_at";

// ── Row → domain ──────────────────────────────────────────

export function toEducation(row: EducationRow): Education {
  return {
    id: row.id,
    userId: row.user_id,
    university: row.university,
    degree: row.degree,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Domain → insert row ───────────────────────────────────

export type EducationInsertRow = {
  user_id: string;
  university: string;
  degree: string;
  start_date: string;
  end_date?: string | null;
};

export function toEducationInsert(
  input: CreateEducationInput,
  userId: string,
): EducationInsertRow {
  return {
    user_id: userId,
    university: input.university,
    degree: input.degree,
    start_date: input.startDate,
    ...(input.endDate !== undefined && { end_date: input.endDate }),
  };
}

// ── Domain → update row ───────────────────────────────────

export type EducationUpdateRow = {
  university?: string;
  degree?: string;
  start_date?: string;
  end_date?: string | null;
};

export function toEducationUpdate(
  input: UpdateEducationInput,
): EducationUpdateRow {
  return {
    ...(input.university !== undefined && { university: input.university }),
    ...(input.degree !== undefined && { degree: input.degree }),
    ...(input.startDate !== undefined && { start_date: input.startDate }),
    ...(input.endDate !== undefined && { end_date: input.endDate }),
  };
}
