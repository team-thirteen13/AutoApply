// ─────────────────────────────────────────────────────────────
// Date Normalization & Month-Input Conversion
// ─────────────────────────────────────────────────────────────
// Two concerns:
//
// 1. AI output normalization: converts provider date strings
//    (e.g. "January 2025") to canonical YYYY-MM-DD.
//
// 2. Month-input conversion: bridges the gap between canonical
//    YYYY-MM-DD storage and <input type="month"> which uses YYYY-MM.
//
// Canonical stored format: YYYY-MM-DD (validated by isoDateSchema)
// Browser month input:     YYYY-MM (type="month")
//
// Display boundary:  stored YYYY-MM-DD → input value YYYY-MM
// Store boundary:    input value YYYY-MM → stored YYYY-MM-01
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

// ── Month-input conversion helpers ──────────────────────────

/**
 * Convert a canonical YYYY-MM-DD date to YYYY-MM for <input type="month">.
 *
 * - undefined/null/empty → ""
 * - YYYY-MM-DD → YYYY-MM (truncates day)
 * - YYYY-MM → YYYY-MM (already valid for month input)
 * - invalid value → "" (safe fallback, never throws)
 */
export function toMonthInputValue(
  value: string | null | undefined,
): string {
  if (value === undefined || value === null) return "";
  const trimmed = value.trim();
  if (trimmed === "") return "";

  // YYYY-MM-DD → YYYY-MM
  const ymdMatch = trimmed.match(/^(\d{4}-\d{2})-\d{2}$/);
  if (ymdMatch) return ymdMatch[1];

  // Already YYYY-MM
  const ymMatch = trimmed.match(/^\d{4}-\d{2}$/);
  if (ymMatch) return trimmed;

  // Unrecognized — return empty (safe fallback for month inputs)
  return "";
}

/**
 * Convert a YYYY-MM value from <input type="month"> to canonical YYYY-MM-01.
 *
 * - "" → null (field is empty/absent)
 * - YYYY-MM → YYYY-MM-01
 * - undefined → undefined (optional field not touched)
 * - invalid value → null (safe fallback)
 */
export function fromMonthInputValue(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // YYYY-MM → YYYY-MM-01
  const ymMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (ymMatch) return `${ymMatch[1]}-${ymMatch[2]}-01`;

  // Unrecognized — return null (safe fallback)
  return null;
}

// ── Month name lookup ───────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4,
  jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// ── Core date normalizer ────────────────────────────────────

/**
 * Normalize a date string to canonical YYYY-MM-DD format.
 *
 * Returns:
 *  - YYYY-MM-DD if already valid
 *  - YYYY-MM-01 if given YYYY-MM (month precision)
 *  - YYYY-MM-01 if given "Month YYYY" or "Mon YYYY"
 *  - undefined if input is undefined
 *  - null if input is null or empty string
 *
 * Throws if the date string cannot be normalized safely.
 */
export function normalizeToISODate(
  dateStr: string | null | undefined,
): string | null | undefined {
  // Preserve null/undefined (optional fields)
  if (dateStr === undefined) return undefined;
  if (dateStr === null) return null;

  const trimmed = dateStr.trim();
  if (trimmed === "") return null;

  // Already canonical YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Month precision: YYYY-MM → YYYY-MM-01
  const ymMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2]}-01`;
  }

  // Full month name: "January 2025" or "Jan 2025"
  const monthYearMatch = trimmed.match(
    /^([A-Za-z]+)\s+(\d{4})$/,
  );
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const year = monthYearMatch[2];
    const monthNum = MONTH_MAP[monthName];
    if (monthNum !== undefined) {
      return `${year}-${String(monthNum).padStart(2, "0")}-01`;
    }
  }

  // Cannot normalize — throw so the flow can handle it
  throw new Error(`Cannot normalize date: "${dateStr}"`);
}

// ── Snapshot-level normalizer ───────────────────────────────

type ExperienceEntry = NonNullable<ResumeSnapshot["experiences"]>[number];
type EducationEntry = NonNullable<ResumeSnapshot["education"]>[number];
type ProjectEntry = NonNullable<ResumeSnapshot["projects"]>[number];
type CertificateEntry = NonNullable<ResumeSnapshot["certificates"]>[number];

function normalizeExperienceDates(entry: ExperienceEntry): ExperienceEntry {
  return {
    ...entry,
    startDate: normalizeToISODate(entry.startDate) as string,
    endDate: normalizeToISODate(entry.endDate),
  };
}

function normalizeEducationDates(entry: EducationEntry): EducationEntry {
  return {
    ...entry,
    startDate: normalizeToISODate(entry.startDate) as string,
    endDate: normalizeToISODate(entry.endDate),
  };
}

function normalizeProjectDates(entry: ProjectEntry): ProjectEntry {
  return {
    ...entry,
    // startDate in projects is string | undefined (null not allowed)
    startDate: normalizeToISODate(entry.startDate) ?? undefined,
    endDate: normalizeToISODate(entry.endDate),
  };
}

function normalizeCertificateDates(entry: CertificateEntry): CertificateEntry {
  return {
    ...entry,
    startDate: normalizeToISODate(entry.startDate) as string,
    endDate: normalizeToISODate(entry.endDate),
  };
}

/**
 * Normalize all date fields in a ResumeSnapshot to canonical YYYY-MM-DD.
 * Returns a new snapshot (no mutation).
 *
 * Throws if any date cannot be normalized safely.
 */
export function normalizeSnapshotDates<T extends ResumeSnapshot>(snapshot: T): T {
  let result = snapshot;

  if (result.experiences) {
    result = {
      ...result,
      experiences: result.experiences.map(normalizeExperienceDates),
    } as T;
  }

  if (result.education) {
    result = {
      ...result,
      education: result.education.map(normalizeEducationDates),
    } as T;
  }

  if (result.projects) {
    result = {
      ...result,
      projects: result.projects.map(normalizeProjectDates),
    } as T;
  }

  if (result.certificates) {
    result = {
      ...result,
      certificates: result.certificates.map(normalizeCertificateDates),
    } as T;
  }

  return result;
}
