// ─────────────────────────────────────────────────────────────
// Resume Optimization Service
// ─────────────────────────────────────────────────────────────
// Application-level service that orchestrates ATS resume
// optimization. Validates input, invokes providers through
// the manager, validates factual preservation, and normalizes
// output. Never calls providers directly.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type { ResumeSnapshot } from "@/types/resume";
import type {
  OptimizeResumeRequest,
  OptimizeResumeOperationResult,
} from "./types";
import {
  validateFactualPreservation,
  overlayImmutableFields,
} from "./factual-preservation";
import {
  ProviderManager,
  type ProviderManagerOutcome,
} from "./provider-manager";

// ── Input Validation ─────────────────────────────────────────

interface ValidateInputResult {
  valid: boolean;
  error?: { code: string; message: string };
}

function validateInput(
  request: OptimizeResumeRequest,
): ValidateInputResult {
  if (!request.resume) {
    return {
      valid: false,
      error: { code: "invalid_request", message: "Resume is required." },
    };
  }

  if (request.optimizationMode !== "ats") {
    return {
      valid: false,
      error: {
        code: "invalid_request",
        message: `Unsupported optimization mode: "${request.optimizationMode}".`,
      },
    };
  }

  if (!request.promptVersion) {
    return {
      valid: false,
      error: {
        code: "invalid_request",
        message: "Prompt version is required.",
      },
    };
  }

  // Check resume has at least some content
  const hasContent =
    request.resume.summary ||
    (request.resume.experiences?.length ?? 0) > 0 ||
    (request.resume.education?.length ?? 0) > 0 ||
    (request.resume.projects?.length ?? 0) > 0 ||
    (request.resume.certificates?.length ?? 0) > 0 ||
    (request.resume.skills?.length ?? 0) > 0;

  if (!hasContent) {
    return {
      valid: false,
      error: {
        code: "invalid_request",
        message: "Resume must contain at least one section with content.",
      },
    };
  }

  return { valid: true };
}

// ── Service ──────────────────────────────────────────────────

export interface OptimizationServiceDeps {
  providerManager: ProviderManager;
}

/**
 * Optimize a resume for ATS keyword alignment.
 *
 * Flow:
 * 1. Validate input
 * 2. Invoke provider manager (handles retry + fallback)
 * 3. Validate factual preservation
 * 4. Normalize output
 * 5. Return validated result
 */
export async function optimizeResume(
  deps: OptimizationServiceDeps,
  request: OptimizeResumeRequest,
): Promise<OptimizeResumeOperationResult> {
  // 1. Validate input
  const inputValidation = validateInput(request);
  if (!inputValidation.valid) {
    return {
      success: false,
      error: {
        code: inputValidation.error!.code as import("./types").ProviderErrorCode,
        message: inputValidation.error!.message,
      },
    };
  }

  // 2. Invoke provider manager
  let outcome: ProviderManagerOutcome;
  try {
    outcome = await deps.providerManager.optimize(request);
  } catch {
    return {
      success: false,
      error: {
        code: "unknown_provider_error",
        message: "An unexpected error occurred during optimization.",
      },
    };
  }

  if (!outcome.success) {
    return {
      success: false,
      error: {
        code: outcome.error.code,
        message: mapErrorMessage(outcome.error),
      },
    };
  }

  // 3. Deterministic source-overlay for immutable fields
  // This is the primary safety mechanism — not a repair attempt.
  const beforeOverlay = outcome.result.optimizedResume;
  outcome.result.optimizedResume = overlayImmutableFields(
    request.resume,
    beforeOverlay,
  );

  // 4. Validate for fabricated metrics and remaining issues
  const factualCheck = validateFactualPreservation(
    request.resume,
    outcome.result.optimizedResume,
  );

  if (!factualCheck.valid) {
    return {
      success: false,
      error: {
        code: "factual_validation_failed",
        message:
          "Optimized resume contains fabricated metrics or unsupported additions.",
      },
    };
  }

  // Log if overlay corrected any violations
  if (JSON.stringify(beforeOverlay) !== JSON.stringify(outcome.result.optimizedResume)) {
    outcome.result.warnings.push(
      "Immutable fields were restored from source resume.",
    );
  }

  // 4. Normalize output
  const normalized = normalizeSnapshot(outcome.result.optimizedResume);

  return {
    success: true,
    data: {
      optimizedResume: normalized,
      changes: outcome.result.changes,
      warnings: outcome.result.warnings,
      metadata: outcome.metadata,
    },
  };
}

// ── Error Mapping ────────────────────────────────────────────

function mapErrorMessage(error: import("./types").ProviderError): string {
  switch (error.code) {
    case "rate_limited":
      return "Service is temporarily busy. Please try again later.";
    case "timeout":
      return "Optimization request timed out. Please try again.";
    case "provider_unavailable":
      return "AI service is temporarily unavailable. Please try again later.";
    case "provider_authentication_failed":
      return "AI service configuration error.";
    case "unsupported_model":
      return "AI model configuration error.";
    case "malformed_provider_output":
      return "AI service returned an invalid response.";
    case "factual_validation_failed":
      return "AI output could not be validated against source resume.";
    case "all_providers_failed":
      return "All AI services are currently unavailable. Please try again later.";
    case "invalid_request":
      return "Invalid optimization request.";
    case "configuration_error":
      return "AI service configuration error.";
    case "authentication_required":
      return "Authentication required.";
    case "unknown_provider_error":
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

// ── Normalization ────────────────────────────────────────────

function normalizeSnapshot(snapshot: ResumeSnapshot): ResumeSnapshot {
  return {
    ...snapshot,
    summary: snapshot.summary?.trim() || undefined,
    experiences: snapshot.experiences?.map((exp) => ({
      ...exp,
      description: exp.description?.trim() || undefined,
      accomplishments: exp.accomplishments
        ?.map((a) => a.trim())
        .filter(Boolean),
      skills: exp.skills?.map((s) => s.trim()).filter(Boolean),
    })),
    projects: snapshot.projects?.map((proj) => ({
      ...proj,
      description: proj.description?.trim() || undefined,
      technologies: proj.technologies
        ?.map((t) => t.trim())
        .filter(Boolean),
    })),
    education: snapshot.education?.map((edu) => ({
      ...edu,
      description: edu.description?.trim() || undefined,
    })),
    skills: snapshot.skills?.map((skill) => ({
      ...skill,
      name: skill.name.trim(),
      category: skill.category?.trim() || "",
      proficiency: skill.proficiency?.trim() || "",
    })),
    languages: snapshot.languages?.map((lang) => ({
      ...lang,
      name: lang.name.trim(),
      proficiency: lang.proficiency?.trim() || undefined,
    })),
  };
}
