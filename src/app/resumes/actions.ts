"use server";

import { revalidatePath } from "next/cache";
import {
  createResume,
  getResume,
  listResumes,
  updateResume,
  createVersion,
  listVersions,
  deleteResume,
  INITIAL_SNAPSHOT,
} from "@/features/resume";
import { getProfile } from "@/features/profile/get-profile";
import { MockAIProvider } from "@/lib/ai";
import type { ResumeSnapshot } from "@/types/resume";

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

// ── Get profile for pre-filling ─────────────────────────────

export async function getProfileAction() {
  return getProfile();
}
