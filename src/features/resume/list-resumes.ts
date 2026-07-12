import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { Resume, ResumeOperationResult } from "@/types/resume";
import { RESUME_COLUMNS, toResume } from "./resume-map";

// ─────────────────────────────────────────────────────────────
// listResumes
// ─────────────────────────────────────────────────────────────
// Authenticated list of all resumes for the current user.
// Returns empty array if no resumes exist.
// ─────────────────────────────────────────────────────────────

export async function listResumes(): Promise<
  ResumeOperationResult<Resume[]>
> {
  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("resumes")
      .select(RESUME_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    return {
      success: true,
      data: (data ?? []).map(toResume),
    };
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
