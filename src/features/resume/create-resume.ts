import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Resume, ResumeOperationResult } from "@/types/resume";
import { createResumeSchema } from "@/lib/validation/resume";
import {
  RESUME_COLUMNS,
  toResume,
  toResumeInsert,
} from "./resume-map";

// ─────────────────────────────────────────────────────────────
// createResume
// ─────────────────────────────────────────────────────────────
// Authenticated resume creation.
// Validates input before auth or DB access.
// Derives user_id exclusively from requireAuthenticatedUser().
// ─────────────────────────────────────────────────────────────

export async function createResume(
  input: unknown,
): Promise<ResumeOperationResult<Resume>> {
  const parsed = createResumeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const insertRow = toResumeInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from("resumes")
      .insert(insertRow)
      .select(RESUME_COLUMNS)
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

    return { success: true, data: toResume(data) };
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
