"use server";

import { redirect } from "next/navigation";
import {
  createResume,
  getResume,
  listResumes,
  updateResume,
  deleteResume,
  createVersion,
  listVersions,
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

// ── List resumes ────────────────────────────────────────────

export async function listResumesAction() {
  return listResumes();
}

// ── Create resume ───────────────────────────────────────────

export async function createResumeAction(formData: FormData) {
  const title = formData.get("title") as string;
  const targetRole = (formData.get("targetRole") as string) || null;

  const result = await createResume({ title, targetRole });

  if (!result.success) {
    return result;
  }

  // Create initial empty version
  const snapshot: ResumeSnapshot = {};
  const versionResult = await createVersion(result.data.id, snapshot, {
    label: "Initial draft",
  });

  if (!versionResult.success) {
    // Resume created but version failed - still return success
    // The resume exists and can be edited
  }

  redirect(`/resumes/${result.data.id}/edit`);
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

// ── Delete resume ───────────────────────────────────────────

export async function deleteResumeAction(id: string) {
  const result = await deleteResume(id);
  if (result.success) {
    redirect("/dashboard");
  }
  return result;
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
