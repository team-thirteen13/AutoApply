import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { UserSkill, SkillOperationResult } from "@/types/skill";
import { skillIdSchema } from "@/lib/validation/skill";
import { USER_SKILL_COLUMNS, SKILL_COLUMNS, toUserSkill, type UserSkillRow } from "./skill-map";

export async function addUserSkill(
  skillId: unknown,
): Promise<SkillOperationResult<UserSkill>> {
  const parsedId = skillIdSchema.safeParse(skillId);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid skill ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    // Verify the skill exists
    const { data: skill, error: skillError } = await supabase
      .from("skills")
      .select(SKILL_COLUMNS)
      .eq("id", parsedId.data)
      .maybeSingle();

    if (skillError) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!skill) {
      return {
        success: false,
        error: {
          code: "skill_not_found",
          message: "Skill not found",
        },
      };
    }

    // Check for existing association
    const { data: existing } = await supabase
      .from("user_skills")
      .select(USER_SKILL_COLUMNS)
      .eq("user_id", user.id)
      .eq("skill_id", parsedId.data)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: {
          code: "user_skill_already_exists",
          message: "Skill already in your inventory",
        },
      };
    }

    // Insert the association
    const { data, error } = await supabase
      .from("user_skills")
      .insert({ user_id: user.id, skill_id: parsedId.data })
      .select(`${USER_SKILL_COLUMNS}, skills(${SKILL_COLUMNS})`)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!data) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return { success: true, data: toUserSkill(data as unknown as UserSkillRow) };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: { code: "authentication_required", message: error.message },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
