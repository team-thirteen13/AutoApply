"use server";

// ─────────────────────────────────────────────────────────────
// ATS Resume Optimization Server Action
// ─────────────────────────────────────────────────────────────
// Server action for optimizing a resume for ATS keyword alignment.
// Validates input, invokes the optimization service, and returns
// only safe, validated results. Never exposes provider details.
// ─────────────────────────────────────────────────────────────

import { requireAuthenticatedUser } from "@/lib/supabase/session";
import { AuthenticationRequiredError } from "@/types/auth";
import { optimizeResume } from "@/lib/ai/optimization/service";
import { ProviderManager } from "@/lib/ai/optimization/provider-manager";
import { GroqResumeOptimizationProvider } from "@/lib/ai/optimization/groq-provider";
import { OpenRouterResumeOptimizationProvider } from "@/lib/ai/optimization/openrouter-provider";
import { MockResumeOptimizationProvider } from "@/lib/ai/optimization/mock-provider";
import { getOptimizationConfig } from "@/lib/ai/optimization/config";
import type { ResumeSnapshot } from "@/types/resume";
import type {
  OptimizationChange,
  OptimizationMetadata,
} from "@/lib/ai/optimization/types";

// ── Request Type ─────────────────────────────────────────────

export interface OptimizeResumeActionRequest {
  /** The reviewed resume snapshot to optimize. */
  resume: ResumeSnapshot;
  /** Target job title for keyword alignment. */
  targetJobTitle?: string;
  /** Target job description for keyword extraction. */
  targetJobDescription?: string;
}

// ── Response Types ───────────────────────────────────────────

export type OptimizeResumeActionResult =
  | {
      success: true;
      data: {
        optimizedResume: ResumeSnapshot;
        changes: OptimizationChange[];
        warnings: string[];
        metadata: OptimizationMetadata;
      };
    }
  | {
      success: false;
      error: string;
      code: string;
    };

// ── Safe Error Messages ──────────────────────────────────────
// Maps internal error codes to safe user-facing messages.
// Never exposes provider names, API keys, or internal details.

const SAFE_ERROR_MESSAGES: Record<string, string> = {
  rate_limited:
    "The optimization service is busy right now. Please wait a moment and try again.",
  timeout:
    "The optimization took too long. Please try again.",
  all_providers_failed:
    "The optimization service is temporarily unavailable. Your resume has not been changed.",
  factual_validation_failed:
    "The generated result could not be verified safely. Please try again.",
  configuration_error:
    "Resume optimization is currently unavailable.",
  invalid_request:
    "The optimization request is invalid. Please check your resume and try again.",
  provider_unavailable:
    "The optimization service is temporarily unavailable. Please try again later.",
  provider_authentication_failed:
    "Resume optimization is currently unavailable.",
  unsupported_model:
    "Resume optimization is currently unavailable.",
  malformed_provider_output:
    "The optimization service returned an unexpected response. Please try again.",
  unknown_provider_error:
    "An unexpected error occurred during optimization. Please try again.",
  authentication_required:
    "You must be signed in to optimize a resume.",
  missing_api_key:
    "Resume optimization is currently unavailable.",
};

// ── Input Validation ─────────────────────────────────────────

const MAX_JOB_TITLE_LENGTH = 200;
const MAX_JOB_DESCRIPTION_LENGTH = 10_000;

interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

function validateInput(request: OptimizeResumeActionRequest): ValidationResult {
  if (!request.resume) {
    return {
      valid: false,
      error: "Resume is required.",
      code: "invalid_request",
    };
  }

  // Check resume has content
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
      error: "Resume must contain at least one section with content.",
      code: "invalid_request",
    };
  }

  // Validate optional fields
  if (
    request.targetJobTitle &&
    request.targetJobTitle.length > MAX_JOB_TITLE_LENGTH
  ) {
    return {
      valid: false,
      error: `Target job title must be ${MAX_JOB_TITLE_LENGTH} characters or less.`,
      code: "invalid_request",
    };
  }

  if (
    request.targetJobDescription &&
    request.targetJobDescription.length > MAX_JOB_DESCRIPTION_LENGTH
  ) {
    return {
      valid: false,
      error: `Target job description must be ${MAX_JOB_DESCRIPTION_LENGTH} characters or less.`,
      code: "invalid_request",
    };
  }

  return { valid: true };
}

// ── Action ───────────────────────────────────────────────────

/**
 * Optimize a resume for ATS keyword alignment.
 *
 * Flow:
 * 1. Require authentication
 * 2. Validate input
 * 3. Get optimization config (server-only)
 * 4. Create provider manager
 * 5. Invoke optimization service
 * 6. Return safe, validated result
 *
 * Never exposes:
 * - Provider names (Groq, OpenRouter)
 * - API keys
 * - Model names
 * - Internal configuration
 * - Raw provider responses
 */
export async function optimizeResumeAction(
  request: OptimizeResumeActionRequest,
): Promise<OptimizeResumeActionResult> {
  try {
    // 1. Require authentication
    await requireAuthenticatedUser();

    // 2. Validate input
    const validation = validateInput(request);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error!,
        code: validation.code!,
      };
    }

    // 3. Get optimization config (server-only, never exposed to client)
    let serviceConfig: ReturnType<typeof getOptimizationConfig>;
    try {
      serviceConfig = getOptimizationConfig();
    } catch {
      return {
        success: false,
        error: SAFE_ERROR_MESSAGES.configuration_error,
        code: "configuration_error",
      };
    }

    // 4. Create provider manager
    let providerManager: ProviderManager;

    if (!serviceConfig) {
      // Mock mode — use deterministic mock provider
      const mockProvider = new MockResumeOptimizationProvider();
      providerManager = new ProviderManager({
        primary: mockProvider,
        retryPolicy: {
          maxPrimaryAttempts: 1,
          baseDelayMs: 0,
          maxDelayMs: 0,
          maxTotalDurationMs: 5000,
        },
        promptVersion: "ats-v1",
      });
    } else {
      // Real providers from config
      const primaryProvider = new GroqResumeOptimizationProvider(serviceConfig.primary);
      const fallbackProvider = serviceConfig.fallback
        ? new OpenRouterResumeOptimizationProvider(serviceConfig.fallback)
        : undefined;

      providerManager = new ProviderManager({
        primary: primaryProvider,
        fallback: fallbackProvider,
        retryPolicy: serviceConfig.retryPolicy,
        promptVersion: serviceConfig.promptVersion,
      });
    }

    // 5. Invoke optimization service
    const result = await optimizeResume(
      { providerManager },
      {
        resume: request.resume,
        targetJobTitle: request.targetJobTitle,
        targetJobDescription: request.targetJobDescription,
        optimizationMode: "ats",
        promptVersion: serviceConfig?.promptVersion ?? "ats-v1",
      },
    );

    // 6. Return safe result
    if (!result.success) {
      const safeMessage =
        SAFE_ERROR_MESSAGES[result.error.code] ||
        SAFE_ERROR_MESSAGES.unknown_provider_error;

      return {
        success: false,
        error: safeMessage,
        code: result.error.code,
      };
    }

    return {
      success: true,
      data: {
        optimizedResume: result.data.optimizedResume,
        changes: result.data.changes,
        warnings: result.data.warnings,
        metadata: result.data.metadata,
      },
    };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return {
        success: false,
        error: SAFE_ERROR_MESSAGES.authentication_required,
        code: "authentication_required",
      };
    }

    return {
      success: false,
      error: SAFE_ERROR_MESSAGES.unknown_provider_error,
      code: "unknown_provider_error",
    };
  }
}

// ── Availability Check ───────────────────────────────────────

export interface OptimizationAvailability {
  available: boolean;
  reason?: "authentication_required" | "not_configured" | "configuration_error";
}

/**
 * Check if ATS optimization is available.
 * Returns only a safe boolean/capability result.
 * Never exposes provider details or configuration errors.
 */
export async function checkOptimizationAvailability(): Promise<OptimizationAvailability> {
  try {
    await requireAuthenticatedUser();
  } catch {
    return { available: false, reason: "authentication_required" };
  }

  try {
    const config = getOptimizationConfig();
    // Mock mode (config is null) — always available
    if (!config) {
      return { available: true };
    }
    // Check if at least one API key is configured
    if (!config.primary.apiKey) {
      return { available: false, reason: "not_configured" };
    }
    return { available: true };
  } catch {
    return { available: false, reason: "configuration_error" };
  }
}
