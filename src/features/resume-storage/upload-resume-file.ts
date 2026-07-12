// ─────────────────────────────────────────────────────────────
// Upload Resume File
// ─────────────────────────────────────────────────────────────
// Uploads a resume file to Supabase Storage with owner-scoped
// paths. Validates file type, size, and resume ownership.
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

    // 4. Verify resume ownership
    const supabase = await createClient();
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id")
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

    // 5. Build storage path
    const filePath = buildStoragePath(user.id, resumeId, file.name);
    const bucket = getStorageBucket();

    // 6. Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: { code: "upload_failed", message: "Failed to upload file" },
      };
    }

    // 7. Update resume record with file path
    const { error: updateError } = await supabase
      .from("resumes")
      .update({ file_path: filePath })
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
