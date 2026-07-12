import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ResumeVersion, ResumeOperationResult } from "@/types/resume";
import { resumeIdSchema, versionIdSchema } from "@/lib/validation/resume";
import {
  RESUME_VERSION_COLUMNS,
  toResumeVersion,
  type ResumeVersionRow,
} from "@/features/resume/resume-map";

export async function getResumeVersion(
  resumeId: unknown,
  versionId: unknown,
): Promise<ResumeOperationResult<ResumeVersion>> {
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

    const { data, error } = await supabase
      .from("resume_versions")
      .select(RESUME_VERSION_COLUMNS)
      .eq("id", parsedVersionId.data)
      .eq("resume_id", parsedResumeId.data)
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
        error: { code: "version_not_found", message: "No version found for this resume" },
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
