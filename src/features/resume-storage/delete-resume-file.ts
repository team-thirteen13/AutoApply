// ─────────────────────────────────────────────────────────────
// Delete Resume File
// ─────────────────────────────────────────────────────────────
// Deletes a resume file from Supabase Storage with compensation.
// Verifies ownership before deletion.
//
// Delete flow:
// 1. Authenticate and verify resume ownership
// 2. Read current file_path
// 3. Conditionally clear file_path (WHERE file_path = expected)
// 4. Remove storage object
// 5. On storage failure: restore file_path (compensation)
// 6. On restore failure: return consistency error
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

    const filePath = resume.file_path as string;
    const bucket = getStorageBucket();

    // 4. Conditionally clear file_path (prevents clearing a newer path).
    // Use select() to verify the row was actually updated — if file_path
    // changed concurrently, zero rows match and we must not proceed.
    const { data: clearedRow, error: clearError } = await supabase
      .from("resumes")
      .update({ file_path: null })
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .eq("file_path", filePath)
      .select("id")
      .single();

    if (clearError) {
      return {
        success: false,
        error: { code: "unexpected", message: "Failed to update resume record" },
      };
    }

    // If zero rows matched, file_path was changed concurrently — abort
    // without touching storage.
    if (!clearedRow) {
      return {
        success: false,
        error: {
          code: "conflict",
          message: "File metadata changed concurrently, please retry",
        },
      };
    }

    // 5. Remove storage object
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (deleteError) {
      // Compensation: restore file_path on storage failure
      const { error: restoreError } = await supabase
        .from("resumes")
        .update({ file_path: filePath })
        .eq("id", resumeId)
        .eq("user_id", user.id);

      if (restoreError) {
        return {
          success: false,
          error: {
            code: "unexpected",
            message: "Delete failed and metadata could not be restored",
          },
        };
      }

      return {
        success: false,
        error: { code: "unexpected", message: "Failed to delete file" },
      };
    }

    // 6. Success — file_path cleared, storage removed
    // Revalidate only after complete success
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
