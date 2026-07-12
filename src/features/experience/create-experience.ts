import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Experience, ExperienceOperationResult } from "@/types/experience";
import { createExperienceSchema } from "@/lib/validation/experience";
import {
  EXPERIENCE_COLUMNS,
  toExperience,
  toExperienceInsert,
} from "./experience-map";

// ─────────────────────────────────────────────────────────────
// createExperience
// ─────────────────────────────────────────────────────────────
// Authenticated experience creation.
// Validates input before auth or DB access.
// Derives user_id exclusively from requireAuthenticatedUser().
// ─────────────────────────────────────────────────────────────

export async function createExperience(
  input: unknown,
): Promise<ExperienceOperationResult<Experience>> {
  const parsed = createExperienceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid experience data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const insertRow = toExperienceInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from("experiences")
      .insert(insertRow)
      .select(EXPERIENCE_COLUMNS)
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

    return { success: true, data: toExperience(data) };
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
