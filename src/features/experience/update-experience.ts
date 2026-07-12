import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Experience, ExperienceOperationResult } from "@/types/experience";
import {
  experienceIdSchema,
  updateExperienceSchema,
} from "@/lib/validation/experience";
import {
  EXPERIENCE_COLUMNS,
  toExperience,
  toExperienceUpdate,
  type ExperienceRow,
} from "./experience-map";

// ─────────────────────────────────────────────────────────────
// validateExperienceDateState (internal)
// ─────────────────────────────────────────────────────────────
// Validates the merged final date state after read-merge-update.
// ─────────────────────────────────────────────────────────────

function validateExperienceDateState(state: {
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}): { valid: true } | { valid: false; message: string } {
  if (state.isCurrent && state.endDate != null) {
    return { valid: false, message: "End date must be null when is current" };
  }
  if (state.endDate != null && state.endDate < state.startDate) {
    return { valid: false, message: "End date must be on or after start date" };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// updateExperience
// ─────────────────────────────────────────────────────────────
// Authenticated partial update with final-state date validation.
// Validates id and patch before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function updateExperience(
  id: unknown,
  input: unknown,
): Promise<ExperienceOperationResult<Experience>> {
  const parsedId = experienceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid experience ID" },
    };
  }

  const parsedPatch = updateExperienceSchema.safeParse(input);
  if (!parsedPatch.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid experience data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    // Step 1: Read existing row
    const { data: existingRow, error: readError } = await supabase
      .from("experiences")
      .select(EXPERIENCE_COLUMNS)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!existingRow) {
      return {
        success: false,
        error: { code: "experience_not_found", message: "No experience found for this user" },
      };
    }

    // Step 2: Map existing row and construct final state
    const existingExperience = toExperience(existingRow as ExperienceRow);
    const patch = parsedPatch.data;

    const finalState = {
      startDate:
        patch.startDate !== undefined
          ? patch.startDate
          : existingExperience.startDate,
      endDate:
        patch.endDate !== undefined
          ? patch.endDate
          : existingExperience.endDate,
      isCurrent:
        patch.isCurrent !== undefined
          ? patch.isCurrent
          : existingExperience.isCurrent,
    };

    // Step 3: Validate final date state
    const dateValidation = validateExperienceDateState(finalState);
    if (!dateValidation.valid) {
      return {
        success: false,
        error: { code: "validation_error", message: dateValidation.message },
      };
    }

    // Step 4: Map only the caller-provided patch
    const updateRow = toExperienceUpdate(patch);

    // Step 5: Run scoped update
    const { data: updatedRow, error: updateError } = await supabase
      .from("experiences")
      .update(updateRow)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select(EXPERIENCE_COLUMNS)
      .maybeSingle();

    if (updateError) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!updatedRow) {
      return {
        success: false,
        error: { code: "experience_not_found", message: "No experience found for this user" },
      };
    }

    return { success: true, data: toExperience(updatedRow as ExperienceRow) };
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
