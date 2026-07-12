// ── Skill (global) ────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  createdAt: string;
}

// ── User skill association ────────────────────────────────

export interface UserSkill {
  userId: string;
  skillId: string;
  skill: Skill;
  createdAt: string;
}

// ── Structured error ──────────────────────────────────────

export interface SkillError {
  code: SkillErrorCode;
  message: string;
}

export type SkillErrorCode =
  | "authentication_required"
  | "skill_not_found"
  | "user_skill_not_found"
  | "user_skill_already_exists"
  | "validation_error"
  | "unexpected";

// ── Generic result type ───────────────────────────────────

export type SkillOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: SkillError };
