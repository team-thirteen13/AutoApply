// ─────────────────────────────────────────────────────────────
// Skills Normalization
// ─────────────────────────────────────────────────────────────
// Handles conversion of legacy string[] skills to the standardized
// object form: Array<{ name: string; category: string; proficiency: string }>
//
// Legacy data may contain:
//  - string[] (old format from AI generation or manual entry)
//  - Array<{ name, category?, proficiency? }> (new format, possibly incomplete)
//
// Normalization happens at the boundary when loading data, not in
// every component. New saves always use the object form.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

type NormalizedSkill = NonNullable<ResumeSnapshot["skills"]>[number];

// Accept both legacy and new format for input
type LegacySkill = string | { id?: string; name: string; category?: string; proficiency?: string };

/**
 * Normalize legacy string[] skills to object form.
 * Returns an empty array if input is undefined or empty.
 *
 * @param skills - Legacy or new format skills array
 * @returns Normalized array of skill objects
 */
export function normalizeSkills(
  skills: Array<LegacySkill> | undefined,
): NormalizedSkill[] {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  return skills.map((skill) => {
    // Already in object form
    if (typeof skill === "object" && skill !== null && "name" in skill) {
      return {
        id: skill.id,
        name: skill.name,
        category: skill.category ?? "",
        proficiency: skill.proficiency ?? "",
      };
    }

    // String form (legacy)
    if (typeof skill === "string") {
      return {
        name: skill,
        category: "",
        proficiency: "",
      };
    }

    // Fallback (shouldn't happen with proper typing)
    return {
      name: String(skill),
      category: "",
      proficiency: "",
    };
  });
}

/**
 * Normalize skills in a full ResumeSnapshot.
 * Returns a new snapshot with normalized skills.
 */
export function normalizeSnapshotSkills<T extends { skills?: Array<LegacySkill> }>(
  snapshot: T,
): T {
  if (snapshot.skills) {
    return {
      ...snapshot,
      skills: normalizeSkills(snapshot.skills) as T["skills"],
    };
  }
  return snapshot;
}
