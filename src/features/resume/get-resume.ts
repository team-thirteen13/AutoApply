import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Resume, ResumeOperationResult } from "@/types/resume";
import { resumeIdSchema } from "@/lib/validation/resume";
import { RESUME_COLUMNS, toResume, type ResumeRow } from "./resume-map";

// ─────────────────────────────────────────────────────────────
// getResume
// ─────────────────────────────────────────────────────────────
// Authenticated single-resume read by ID.
// Validates ID before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function getResume(
  id: unknown,
): Promise<ResumeOperationResult<Resume>> {
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
      .select(RESUME_COLUMNS)
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
        error: { code: "resume_not_found", message: "No resume found for this user" },
      };
    }

    return { success: true, data: toResume(data as ResumeRow) };
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
