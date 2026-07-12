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
} from "./resume-map";

// ─────────────────────────────────────────────────────────────
// createVersion
// ─────────────────────────────────────────────────────────────
// Authenticated version creation for a resume.
// Validates resumeId and optional label before auth or DB access.
// The snapshot is provided explicitly (composed by the caller).
// Verifies the resume exists and belongs to the user.
// ─────────────────────────────────────────────────────────────

export async function createVersion(
  resumeId: unknown,
  snapshot: ResumeSnapshot,
  input?: unknown,
): Promise<ResumeOperationResult<ResumeVersion>> {
  const parsedResumeId = resumeIdSchema.safeParse(resumeId);
  if (!parsedResumeId.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid resume ID" },
    };
  }

  const parsedInput = createVersionSchema.safeParse(input ?? {});
  if (!parsedInput.success) {
    return {
      success: false,
      error: { code: "validation_error", message: "Invalid version data" },
    };
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = await createClient();

    // Verify resume exists and belongs to user
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

    // Create version
    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        resume_id: parsedResumeId.data,
        user_id: user.id,
        snapshot,
        ...(parsedInput.data.label !== undefined && {
          label: parsedInput.data.label,
        }),
      })
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
