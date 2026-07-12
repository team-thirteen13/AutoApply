import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ResumeOperationResult } from "@/types/resume";
import { resumeIdSchema, versionIdSchema } from "@/lib/validation/resume";

export async function deleteResumeVersion(
  resumeId: unknown,
  versionId: unknown,
): Promise<ResumeOperationResult<void>> {
  const parsedResumeId = resumeIdSchema.safeParse(resumeId);
  if (!parsedResumeId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume ID" },
    };
  }

  const parsedVersionId = versionIdSchema.safeParse(versionId);
  if (!parsedVersionId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid version ID" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    // Verify parent resume belongs to user
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", parsedResumeId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (resumeError) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    if (!resume) {
      return {
        success: false,
        error: { code: "resume_not_found", message: "No resume found for this user" },
      };
    }

    // Check version exists before deleting
    const { data: existing } = await supabase
      .from("resume_versions")
      .select("id")
      .eq("id", parsedVersionId.data)
      .eq("resume_id", parsedResumeId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return {
        success: false,
        error: { code: "version_not_found", message: "No version found for this resume" },
      };
    }

    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", parsedVersionId.data)
      .eq("resume_id", parsedResumeId.data)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
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
