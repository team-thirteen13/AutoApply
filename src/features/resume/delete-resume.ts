import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ResumeOperationResult } from "@/types/resume";
import { resumeIdSchema } from "@/lib/validation/resume";

// ─────────────────────────────────────────────────────────────
// deleteResume
// ─────────────────────────────────────────────────────────────
// Authenticated hard delete by ID with ownership verification.
// Also deletes all associated resume_versions (cascade).
// Validates ID before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function deleteResume(
  id: unknown,
): Promise<ResumeOperationResult<undefined>> {
  const parsedId = resumeIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("resumes")
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
        error: { code: "resume_not_found", message: "No resume found for this user" },
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
