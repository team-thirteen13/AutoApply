import type { Skill, UserSkill } from "@/types/skill";

// ── Database rows ─────────────────────────────────────────

export type SkillRow = {
  id: string;
  name: string;
  created_at: string;
};

export type UserSkillRow = {
  user_id: string;
  skill_id: string;
  created_at: string;
  skills: SkillRow;
};

// ── Explicit column selection ──────────────────────────────

export const SKILL_COLUMNS = "id, name, created_at";
export const USER_SKILL_COLUMNS = "user_id, skill_id, created_at";

// ── Row → domain ──────────────────────────────────────────

export function toSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function toUserSkill(row: UserSkillRow): UserSkill {
  return {
    userId: row.user_id,
    skillId: row.skill_id,
    skill: toSkill(row.skills),
    createdAt: row.created_at,
  };
}
