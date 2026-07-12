import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Resume, ResumeOperationResult } from "@/types/resume";
import {
  resumeIdSchema,
  updateResumeSchema,
} from "@/lib/validation/resume";
import {
  RESUME_COLUMNS,
  toResume,
  toResumeUpdate,
  type ResumeRow,
} from "./resume-map";

// ─────────────────────────────────────────────────────────────
// updateResume
// ─────────────────────────────────────────────────────────────
// Authenticated partial update of resume metadata.
// Validates id and patch before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function updateResume(
  id: unknown,
  input: unknown,
): Promise<ResumeOperationResult<Resume>> {
  const parsedId = resumeIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume ID" },
    };
  }

  const parsedPatch = updateResumeSchema.safeParse(input);
  if (!parsedPatch.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    // Verify resume exists and belongs to user
    const { data: existing, error: readError } = await supabase
      .from("resumes")
      .select(RESUME_COLUMNS)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!existing) {
      return {
        success: false,
        error: { code: "resume_not_found", message: "No resume found for this user" },
      };
    }

    // Run scoped update
    const updateRow = toResumeUpdate(parsedPatch.data);

    const { data: updatedRow, error: updateError } = await supabase
      .from("resumes")
      .update(updateRow)
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select(RESUME_COLUMNS)
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
        error: { code: "resume_not_found", message: "No resume found for this user" },
      };
    }

    return { success: true, data: toResume(updatedRow as ResumeRow) };
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
