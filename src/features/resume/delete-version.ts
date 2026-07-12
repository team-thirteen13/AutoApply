import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ResumeOperationResult } from "@/types/resume";
import { versionIdSchema } from "@/lib/validation/resume";

// ─────────────────────────────────────────────────────────────
// deleteVersion
// ─────────────────────────────────────────────────────────────
// Authenticated hard delete of a version by ID.
// Validates ID before authentication or database access.
// ─────────────────────────────────────────────────────────────

export async function deleteVersion(
  id: unknown,
): Promise<ResumeOperationResult<undefined>> {
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
        error: { code: "version_not_found", message: "No version found for this user" },
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
