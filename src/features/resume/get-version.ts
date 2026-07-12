import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  ResumeVersion,
  ResumeOperationResult,
} from "@/types/resume";
import { versionIdSchema } from "@/lib/validation/resume";
import {
  RESUME_VERSION_COLUMNS,
  toResumeVersion,
  type ResumeVersionRow,
} from "./resume-map";

// ─────────────────────────────────────────────────────────────
// getVersion
// ─────────────────────────────────────────────────────────────
// Authenticated single-version read by ID.
// Validates ID before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function getVersion(
  id: unknown,
): Promise<ResumeOperationResult<ResumeVersion>> {
  const parsedId = versionIdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid version ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("resume_versions")
      .select(RESUME_VERSION_COLUMNS)
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
        error: { code: "version_not_found", message: "No version found for this user" },
      };
    }

    return { success: true, data: toResumeVersion(data as ResumeVersionRow) };
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
