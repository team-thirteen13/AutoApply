// ─────────────────────────────────────────────────────────────
// List Experiences
// ─────────────────────────────────────────────────────────────
// Retrieves all experiences for the authenticated user,
// ordered by start_date descending.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Experience, ExperienceOperationResult } from "@/types/experience";
import { EXPERIENCE_COLUMNS, toExperience } from "./experience-map";

// ── List experiences ────────────────────────────────────────

export async function listExperiences(): Promise<
  ExperienceOperationResult<Experience[]>
> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_COLUMNS)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const experiences = (data ?? []).map(toExperience);
    return { success: true, data: experiences };
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
