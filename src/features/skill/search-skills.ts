import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Skill, SkillOperationResult } from "@/types/skill";
import { SKILL_COLUMNS, toSkill } from "./skill-map";

function escapeLike(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function searchSkills(
  query: string,
): Promise<SkillOperationResult<Skill[]>> {
  const trimmed = query?.trim();
  if (!trimmed) {
    return {
      success: false,
      error: { code: "validation_error", message: "Search query is required" },
    };
  }

  try {
    await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("skills")
      .select(SKILL_COLUMNS)
      .ilike("name", `%${escapeLike(trimmed)}%`)
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const skills = (data ?? []).map(toSkill);
    return { success: true, data: skills };
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
