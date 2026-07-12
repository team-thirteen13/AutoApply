// ─────────────────────────────────────────────────────────────
// Get Experience
// ─────────────────────────────────────────────────────────────
// Retrieves a single experience by ID for the authenticated user.
// Validates the ID before any authentication or database access.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Experience, ExperienceOperationResult } from "@/types/experience";
import { experienceIdSchema } from "@/lib/validation/experience";
import {
  EXPERIENCE_COLUMNS,
  toExperience,
  type ExperienceRow,
} from "./experience-map";

// ── Get experience ──────────────────────────────────────────

export async function getExperience(
  id: unknown
): Promise<ExperienceOperationResult<Experience>> {
  // ── Validate ID before authentication ───────────────────
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
      .select(EXPERIENCE_COLUMNS)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
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
        error: {
          code: "experience_not_found",
          message: "No experience found for this user",
        },
      };
    }

    return { success: true, data: toExperience(data as ExperienceRow) };
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
