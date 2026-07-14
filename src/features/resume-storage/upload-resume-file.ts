// ─────────────────────────────────────────────────────────────
// Upload Resume File
// ─────────────────────────────────────────────────────────────
// Uploads a resume file to Supabase Storage with owner-scoped
// paths. Validates file type, size, and resume ownership.
//
// Upload flow:
// 1. Read current file_path (for old-object cleanup)
// 2. Generate unique UUID path
// 3. Upload new object
// 4. Update resumes.file_path
// 5. On DB failure: remove newly uploaded object (compensation)
// 6. On success: remove old object (best-effort cleanup)
// ─────────────────────────────────────────────────────────────

import "server-only";

import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { resumeIdSchema } from "@/lib/validation/resume";
import { validateResumeFile } from "@/lib/validation/resume-upload";
import { buildStoragePath, getStorageBucket } from "./resume-storage-path";
import type { ResumeUploadOperationResult, ResumeUploadResult } from "@/types/resume-upload";

export async function uploadResumeFile(
  resumeId: string,
  file: File,
): Promise<ResumeUploadOperationResult<ResumeUploadResult>> {
  try {
    // 1. Validate resume ID before auth
    const idResult = resumeIdSchema.safeParse(resumeId);
    if (!idResult.success) {
      return {
        success: false,
        error: { code: "validation_error", message: "Invalid resume ID" },
      };
    }

    // 2. Require authentication
    const user = await requireAuthenticatedUser();

    // 3. Validate file
    const fileResult = validateResumeFile(file);
    if (!fileResult.valid) {
      return {
        success: false,
        error: {
          code: fileResult.error?.includes("empty")
            ? "empty_file"
            : fileResult.error?.includes("size")
              ? "file_too_large"
              : "invalid_file_type",
          message: fileResult.error ?? "Invalid file",
        },
      };
    }

    // 4. Verify resume ownership and read current file_path
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

    const oldFilePath = resume.file_path as string | null;

    // 5. Build storage path (UUID-based for collision resistance)
    const filePath = buildStoragePath(user.id, resumeId, file.name);
    const bucket = getStorageBucket();

    // 6. Upload new object first
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: { code: "upload_failed", message: "Failed to upload file" },
      };
    }

    // 7. Update resumes.file_path only after successful upload
    const { error: updateError } = await supabase
      .from("resumes")
      .update({ file_path: filePath })
      .eq("id", resumeId)
      .eq("user_id", user.id);

    if (updateError) {
      // Compensation: remove the newly uploaded object on DB failure.
      // Supabase Storage remove() resolves with { data, error } —
      // it does not reject, so we must inspect the result.
      const { error: compensateError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (compensateError) {
        // Compensation failed — orphaned object remains in storage
        // but file_path was never updated, so no data corruption.
        // Log internally; do not expose to user.
        console.error(
          "[upload-resume-file] compensation remove failed:",
          compensateError.message,
        );
      }

      return {
        success: false,
        error: { code: "unexpected", message: "Failed to update resume record" },
      };
    }

    // 8. Post-commit cleanup: remove old object if it differs.
    // Best-effort — cleanup failure must not invalidate the new active file.
    if (oldFilePath && oldFilePath !== filePath) {
      const { error: cleanupError } = await supabase.storage
        .from(bucket)
        .remove([oldFilePath]);

      if (cleanupError) {
        // Old object removal failed — stale object remains but the
        // new file is active and file_path points to it. Log internally.
        console.error(
          "[upload-resume-file] old-object cleanup failed:",
          cleanupError.message,
        );
      }
    }

    return {
      success: true,
      data: {
        filePath,
        contentType: file.type,
        size: file.size,
      },
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
