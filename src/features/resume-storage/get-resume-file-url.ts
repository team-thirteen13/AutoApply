// ─────────────────────────────────────────────────────────────
// Get Resume File URL
// ─────────────────────────────────────────────────────────────
// Generates a short-lived signed URL for a resume file.
// Verifies ownership before generating access.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { resumeIdSchema } from "@/lib/validation/resume";
import { getStorageBucket } from "./resume-storage-path";
import type { ResumeUploadOperationResult } from "@/types/resume-upload";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export async function getResumeFileUrl(
  resumeId: string,
): Promise<ResumeUploadOperationResult<{ url: string; expiresAt: number }>> {
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

    // 4. Generate signed URL
    const bucket = getStorageBucket();
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(resume.file_path, SIGNED_URL_EXPIRY_SECONDS);

    if (urlError) {
      return {
        success: false,
        error: { code: "unexpected", message: "Failed to generate signed URL" },
      };
    }

    return {
      success: true,
      data: {
        url: urlData.signedUrl,
        expiresAt: Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000,
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
