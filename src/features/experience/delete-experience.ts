import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ExperienceOperationResult } from "@/types/experience";
import { experienceIdSchema } from "@/lib/validation/experience";

// ─────────────────────────────────────────────────────────────
// deleteExperience
// ─────────────────────────────────────────────────────────────
// Authenticated hard delete by ID with ownership verification.
// Validates ID before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function deleteExperience(
  id: unknown,
): Promise<ExperienceOperationResult<undefined>> {
  const parsedId = experienceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid experience ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select("id")
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
        error: { code: "experience_not_found", message: "No experience found for this user" },
      };
    }

    return { success: true, data: undefined };
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
