"use server";

import { revalidatePath } from "next/cache";
import {
  createResume,
  getResume,
  listResumes,
  updateResume,
  createVersion,
  listVersions,
  getVersion,
  deleteResume,
  INITIAL_SNAPSHOT,
} from "@/features/resume";
import { getProfile } from "@/features/profile/get-profile";
import { MockAIProvider } from "@/lib/ai";
import type { GenerateResumeInput, GenerateResumeOutput } from "@/lib/ai/types";
import { generateResumeContent } from "@/features/ai/generate-resume-content";
import type {
  GenerateResumeOperationResult,
} from "@/features/ai/generate-resume-content";
import type { ResumeSnapshot, ResumeOperationResult, ResumeVersion } from "@/types/resume";

// ─────────────────────────────────────────────────────────────
// Resume Actions
// ─────────────────────────────────────────────────────────────
// Server actions for resume CRUD, version management, and AI
// improve. All operations are authenticated and use existing
// backend functions. No direct Supabase calls.
// ─────────────────────────────────────────────────────────────

const aiProvider = new MockAIProvider();

// ── Create-resume result type ──────────────────────────────

export type CreateResumeResult =
  | { success: true; resumeId: string }
  | { success: false; error: string; fieldErrors?: { title?: string } };

// ── List resumes ────────────────────────────────────────────

export async function listResumesAction() {
  return listResumes();
}

// ── Create resume ───────────────────────────────────────────

export async function createResumeAction(
  title: string,
  targetRole?: string | null,
): Promise<CreateResumeResult> {
  // Validate title at action boundary
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    return {
      success: false,
      error: "Title is required",
      fieldErrors: { title: "Title is required" },
    };
  }

  if (trimmedTitle.length > 200) {
    return {
      success: false,
      error: "Title is too long",
      fieldErrors: { title: "Title must be 200 characters or less" },
    };
  }

  // Create the resume record
  const result = await createResume({
    title: trimmedTitle,
    targetRole: targetRole || null,
  });

  if (!result.success) {
    const message =
      result.error.code === "authentication_required"
        ? "You must be signed in to create a resume"
        : "Failed to create resume. Please try again.";
    return { success: false, error: message };
  }

  // Create initial version with valid snapshot
  const versionResult = await createVersion(
    result.data.id,
    INITIAL_SNAPSHOT,
    { label: "Initial draft" },
  );

  if (!versionResult.success) {
    // Compensation: delete the orphaned resume since the user
    // cannot use it without an initial version.
    await deleteResume(result.data.id).catch(() => {
      // Best-effort cleanup — if delete also fails, the resume
      // will be an orphan but won't cause data corruption.
    });

    return {
      success: false,
      error: "Failed to initialize resume. Please try again.",
    };
  }

  // Revalidate dashboard so the new resume appears
  revalidatePath("/dashboard");

  // Return success — client handles navigation
  return { success: true, resumeId: result.data.id };
}

// ── Get resume with versions ────────────────────────────────

export async function getResumeAction(id: string) {
  const resumeResult = await getResume(id);
  if (!resumeResult.success) {
    return resumeResult;
  }

  const versionsResult = await listVersions(id);
  const versions = versionsResult.success ? versionsResult.data : [];

  return {
    success: true as const,
    data: {
      resume: resumeResult.data,
      versions,
    },
  };
}

// ── Save resume (update metadata + create version) ──────────

export async function saveResumeAction(
  resumeId: string,
  title: string,
  snapshot: ResumeSnapshot,
) {
  // Update resume metadata
  const updateResult = await updateResume(resumeId, { title });
  if (!updateResult.success) {
    return updateResult;
  }

  // Create new version with snapshot
  const versionResult = await createVersion(resumeId, snapshot, {
    label: `Saved ${new Date().toLocaleString()}`,
  });

  if (!versionResult.success) {
    return versionResult;
  }

  return { success: true as const, data: updateResult.data };
}

// ── List versions for a resume ──────────────────────────────

export async function listVersionsAction(
  resumeId: string,
): Promise<ResumeOperationResult<ResumeVersion[]>> {
  return listVersions(resumeId);
}

// ── Restore a historical version ────────────────────────────
// Fetches the historical version, validates ownership, then
// creates a NEW version with the same snapshot. The original
// historical row is never modified.

export async function restoreVersionAction(
  resumeId: string,
  versionId: string,
): Promise<
  ResumeOperationResult<{
    version: ResumeVersion;
    snapshot: ResumeSnapshot;
  }>
> {
  // Fetch the source version (validates ownership via RLS + feature)
  const versionResult = await getVersion(versionId);
  if (!versionResult.success) {
    return versionResult;
  }

  const sourceVersion = versionResult.data;

  // Ensure the version belongs to the same resume
  if (sourceVersion.resumeId !== resumeId) {
    return {
      success: false as const,
      error: {
        code: "version_not_found" as const,
        message: "Version does not belong to this resume",
      },
    };
  }

  // Build a human-readable label
  const sourceDate = new Date(sourceVersion.createdAt).toLocaleString();
  const sourceLabel = sourceVersion.label
    ? `"${sourceVersion.label}"`
    : sourceDate;
  const label = `Restored from version ${sourceLabel}`;

  // Create a new version with the historical snapshot
  const createResult = await createVersion(resumeId, sourceVersion.snapshot, {
    label,
  });

  if (!createResult.success) {
    return createResult;
  }

  // Revalidate dashboard in case timestamps changed
  revalidatePath("/dashboard");

  return {
    success: true as const,
    data: {
      version: createResult.data,
      snapshot: sourceVersion.snapshot,
    },
  };
}

// ── Improve summary with AI ─────────────────────────────────

export async function improveSummaryAction(
  bio: string,
  targetRole?: string,
) {
  return aiProvider.improveSummary({ bio, targetRole });
}

// ── Improve experience with AI ──────────────────────────────

export async function improveExperienceAction(experience: {
  company: string;
  title: string;
  accomplishments: string[];
  skills: string[];
}) {
  return aiProvider.improveExperience({ experience });
}

// ── Generate resume with AI ──────────────────────────────────

export async function generateResumeAction(
  input: GenerateResumeInput,
): Promise<GenerateResumeOperationResult<GenerateResumeOutput>> {
  return generateResumeContent(aiProvider, input);
}

// ── Create resume from generated snapshot ────────────────────
// Creates a resume record and an initial version with the provided
// snapshot (from AI generation). Compensates by deleting the
// orphaned resume if version creation fails.

export async function createResumeWithSnapshotAction(
  title: string,
  snapshot: ResumeSnapshot,
  targetRole?: string | null,
): Promise<CreateResumeResult> {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    return {
      success: false,
      error: "Title is required",
      fieldErrors: { title: "Title is required" },
    };
  }

  if (trimmedTitle.length > 200) {
    return {
      success: false,
      error: "Title is too long",
      fieldErrors: { title: "Title must be 200 characters or less" },
    };
  }

  const result = await createResume({
    title: trimmedTitle,
    targetRole: targetRole || null,
  });

  if (!result.success) {
    const message =
      result.error.code === "authentication_required"
        ? "You must be signed in to create a resume"
        : "Failed to create resume. Please try again.";
    return { success: false, error: message };
  }

  const versionResult = await createVersion(result.data.id, snapshot, {
    label: "AI Generated",
  });

  if (!versionResult.success) {
    await deleteResume(result.data.id).catch(() => {});
    return {
      success: false,
      error: "Failed to save generated resume. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true, resumeId: result.data.id };
}

// ── Get profile for pre-filling ─────────────────────────────

export async function getProfileAction() {
  return getProfile();
}

// ─────────────────────────────────────────────────────────────
// File Management Actions
// ─────────────────────────────────────────────────────────────
// Server actions for resume file upload, download, and deletion.
// Wraps existing resume-storage functions for client use.
// ─────────────────────────────────────────────────────────────

import {
  uploadResumeFile,
  getResumeFileUrl,
  deleteResumeFile,
} from "@/features/resume-storage";

export type FileActionResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

// ── Upload file to resume ───────────────────────────────────

export async function uploadResumeFileAction(
  resumeId: string,
  file: File,
): Promise<FileActionResult> {
  const result = await uploadResumeFile(resumeId, file);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/resumes/${resumeId}/edit`);

  return {
    success: true,
    data: result.data,
  };
}

// ── Get signed URL for resume file ──────────────────────────

export async function getResumeFileUrlAction(
  resumeId: string,
): Promise<FileActionResult> {
  const result = await getResumeFileUrl(resumeId);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// ── Delete resume file ──────────────────────────────────────

export async function deleteResumeFileAction(
  resumeId: string,
): Promise<FileActionResult> {
  const result = await deleteResumeFile(resumeId);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/resumes/${resumeId}/edit`);

  return {
    success: true,
    data: result.data,
  };
}

// ─────────────────────────────────────────────────────────────
// Resume Parsing Actions
// ─────────────────────────────────────────────────────────────
// Server actions for parsing uploaded resume documents.
// Extracts content from PDF/DOCX and returns a normalized
// ResumeSnapshot draft for review before saving.
// ─────────────────────────────────────────────────────────────

import { parseResume } from "@/features/resume-parser";
import type {
  ResumeParserErrorCode,
} from "@/features/resume-parser";
import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";

export type ParseResumeResult =
  | { success: true; data: { snapshot: ResumeSnapshot; warnings: string[] } }
  | { success: false; error: string; code: ResumeParserErrorCode };

/**
 * Parse an uploaded resume file and return a normalized snapshot.
 * Does NOT save to database — returns the parsed result for review.
 * Requires an authenticated user.
 */
export async function parseResumeFileAction(
  file: File,
): Promise<ParseResumeResult> {
  try {
    // Require authentication before any processing
    await requireAuthenticatedUser();

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Unsupported file type. Please upload a PDF or DOCX file.",
        code: "unsupported_file_type",
      };
    }

    // Validate file size (10 MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File exceeds the maximum size of 10 MB.",
        code: "file_too_large",
      };
    }

    if (file.size === 0) {
      return {
        success: false,
        error: "File is empty.",
        code: "empty_document",
      };
    }

    // Convert File to Buffer for server-side parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the resume
    const result = await parseResume(buffer, file.type);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        code: result.error.code,
      };
    }

    return {
      success: true,
      data: {
        snapshot: result.data,
        warnings: result.warnings ?? [],
      },
    };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: "You must be signed in to parse a resume.",
        code: "authentication_required",
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred while parsing the file.",
      code: "extraction_failed",
    };
  }
}
