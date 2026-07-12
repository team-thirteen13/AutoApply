import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { SkillOperationResult } from "@/types/skill";
import { skillIdSchema } from "@/lib/validation/skill";

export async function removeUserSkill(
  skillId: unknown,
): Promise<SkillOperationResult<void>> {
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

    // Check if the association exists before deleting
    const { data: existing } = await supabase
      .from("user_skills")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("skill_id", parsedId.data)
      .maybeSingle();

    if (!existing) {
      return {
        success: false,
        error: {
          code: "user_skill_not_found",
          message: "Skill not found in your inventory",
        },
      };
    }

    const { error } = await supabase
      .from("user_skills")
      .delete()
      .eq("user_id", user.id)
      .eq("skill_id", parsedId.data);

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return { success: true, data: undefined };
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
