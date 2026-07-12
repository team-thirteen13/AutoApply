import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { UserSkill, SkillOperationResult } from "@/types/skill";
import { USER_SKILL_COLUMNS, SKILL_COLUMNS, toUserSkill, type UserSkillRow } from "./skill-map";

export async function listUserSkills(): Promise<
  SkillOperationResult<UserSkill[]>
> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_skills")
      .select(`${USER_SKILL_COLUMNS}, skills(${SKILL_COLUMNS})`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const userSkills = ((data ?? []) as unknown as UserSkillRow[]).map(toUserSkill);
    return { success: true, data: userSkills };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: {
          code: "authentication_required",
          message: error.message,
        },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
