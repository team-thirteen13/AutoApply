import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import type {
  ResumeVersion,
  ResumeSnapshot,
  ResumeOperationResult,
} from "@/types/resume";
import {
  resumeIdSchema,
  createVersionSchema,
} from "@/lib/validation/resume";
import {
  RESUME_VERSION_COLUMNS,
  toResumeVersion,
  type ResumeVersionRow,
} from "@/features/resume/resume-map";

export async function createResumeVersion(
  resumeId: unknown,
  snapshot: ResumeSnapshot,
  label?: unknown,
): Promise<ResumeOperationResult<ResumeVersion>> {
  const parsedResumeId = resumeIdSchema.safeParse(resumeId);
  if (!parsedResumeId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume ID" },
    };
  }

  const parsedLabel = createVersionSchema.safeParse(
    label !== undefined ? { label } : {},
  );
  if (!parsedLabel.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid version data" },
    };
  }

  if (!snapshot || typeof snapshot !== "object") {
    return {
      success: false,
      error: { code: "validation_error", message: "Snapshot must be a valid JSON object" },
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

    const insertRow = {
      resume_id: parsedResumeId.data,
      user_id: user.id,
      snapshot: snapshot as Record<string, unknown>,
      ...(parsedLabel.data.label !== undefined && { label: parsedLabel.data.label }),
    };

    const { data, error } = await supabase
      .from("resume_versions")
      .insert(insertRow)
      .select(RESUME_VERSION_COLUMNS)
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
