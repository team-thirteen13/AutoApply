// ─────────────────────────────────────────────────────────────
// Delete Resume File
// ─────────────────────────────────────────────────────────────
// Deletes a resume file from Supabase Storage.
// Verifies ownership before deletion.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { resumeIdSchema } from "@/lib/validation/resume";
import { getStorageBucket } from "./resume-storage-path";
import type { ResumeUploadOperationResult } from "@/types/resume-upload";

export async function deleteResumeFile(
  resumeId: string,
): Promise<ResumeUploadOperationResult<{ deleted: true }>> {
  try {
    // 1. Validate resume ID
    const idResult = resumeIdSchema.safeParse(resumeId);
    if (!idResult.success) {
      return {
        success: false,
        error: { code: "validation_error", message: "Invalid resume ID" },
      };
    }

    // 2. Require authentication
    const user = await requireAuthenticatedUser();

    // 3. Get resume with file_path
    const supabase = await createClient();
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, file_path")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (resumeError) {
      return {
        success: false,
        error: { code: "unexpected", message: "Failed to verify resume" },
      };
    }

    if (!resume) {
      return {
        success: false,
        error: { code: "resume_not_found", message: "Resume not found" },
      };
    }

    if (!resume.file_path) {
      return {
        success: false,
        error: { code: "not_found", message: "No file uploaded for this resume" },
      };
    }

    // 4. Delete from storage
    const bucket = getStorageBucket();
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([resume.file_path]);

    if (deleteError) {
      return {
        success: false,
        error: { code: "unexpected", message: "Failed to delete file" },
      };
    }

    // 5. Clear file_path from resume record
    const { error: updateError } = await supabase
      .from("resumes")
      .update({ file_path: null })
      .eq("id", resumeId)
      .eq("user_id", user.id);

    if (updateError) {
      return {
        success: false,
        error: { code: "unexpected", message: "Failed to update resume record" },
      };
    }

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AuthenticationRequiredError") {
      return {
        success: false,
        error: { code: "authentication_required", message: "Authentication required" },
      };
    }
    return {
      success: false,
      error: { code: "unexpected", message: "An unexpected error occurred" },
    };
  }
}
