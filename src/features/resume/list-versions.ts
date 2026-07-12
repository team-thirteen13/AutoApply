import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  ResumeVersion,
  ResumeOperationResult,
} from "@/types/resume";
import { resumeIdSchema } from "@/lib/validation/resume";
import {
  RESUME_VERSION_COLUMNS,
  toResumeVersion,
} from "./resume-map";

// ─────────────────────────────────────────────────────────────
// listVersions
// ─────────────────────────────────────────────────────────────
// Authenticated list of all versions for a resume.
// Validates resumeId before auth or DB access.
// Returns empty array if no versions exist.
// ─────────────────────────────────────────────────────────────

export async function listVersions(
  resumeId: unknown,
): Promise<ResumeOperationResult<ResumeVersion[]>> {
  const parsedId = resumeIdSchema.safeParse(resumeId);
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
      .from("resume_versions")
      .select(RESUME_VERSION_COLUMNS)
      .eq("resume_id", parsedId.data)
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
      data: (data ?? []).map(toResumeVersion),
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
