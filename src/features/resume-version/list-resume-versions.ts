import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type { ResumeVersion, ResumeOperationResult } from "@/types/resume";
import { resumeIdSchema } from "@/lib/validation/resume";
import {
  RESUME_VERSION_COLUMNS,
  toResumeVersion,
} from "@/features/resume/resume-map";

export async function listResumeVersions(
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

    // Verify parent resume belongs to user
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", parsedId.data)
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
      .eq("resume_id", parsedId.data)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: { code: "unexpected", message: "An unexpected error occurred" },
      };
    }

    const versions = (data ?? []).map(toResumeVersion);
    return { success: true, data: versions };
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
