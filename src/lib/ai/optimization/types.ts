// ─────────────────────────────────────────────────────────────
// ATS Resume Optimization Types
// ─────────────────────────────────────────────────────────────
// Types for the ATS resume optimization service.
// Defines provider contracts, request/response shapes,
// error taxonomy, and change metadata.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

// ── Optimization Mode ────────────────────────────────────────

export type OptimizationMode = "ats";

// ── Provider Error Taxonomy ──────────────────────────────────

export type ProviderErrorCode =
  | "authentication_required"
  | "configuration_error"
  | "invalid_request"
  | "timeout"
  | "rate_limited"
  | "provider_unavailable"
  | "provider_authentication_failed"
  | "unsupported_model"
  | "malformed_provider_output"
  | "factual_validation_failed"
  | "all_providers_failed"
  | "unknown_provider_error";

export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  providerId?: string;
  retryable: boolean;
}

// ── Provider Request Context ─────────────────────────────────

export interface ProviderRequestContext {
  /** Request timeout in milliseconds. */
  timeoutMs: number;
  /** Maximum output tokens. */
  maxOutputTokens?: number;
  /** Prompt version identifier. */
  promptVersion: string;
}

// ── Optimization Request ─────────────────────────────────────

export interface OptimizeResumeRequest {
  /** The source resume snapshot to optimize. */
  resume: ResumeSnapshot;
  /** Target job title for keyword alignment. */
  targetJobTitle?: string;
  /** Target job description for keyword extraction. */
  targetJobDescription?: string;
  /** Target industry for context. */
  targetIndustry?: string;
  /** Experience level for tone calibration. */
  experienceLevel?: string;
  /** Optimization mode (V1: "ats" only). */
  optimizationMode: OptimizationMode;
  /** Prompt version to use. */
  promptVersion: string;
}

// ── Change Metadata ──────────────────────────────────────────

export type ChangeReasonCategory =
  | "keyword_alignment"
  | "action_verbs"
  | "conciseness"
  | "tense_consistency"
  | "terminology"
  | "readability"
  | "filler_removal"
  | "skill_organization"
  | "summary_relevance"
  | "bullet_clarity";

export interface OptimizationChange {
  /** Section that was modified. */
  section: string;
  /** Field identifier within the section. */
  field: string;
  /** Original value from source resume. */
  originalValue: string;
  /** Optimized value from provider. */
  optimizedValue: string;
  /** Reason category for the change. */
  reason: ChangeReasonCategory;
}

// ── Provider Result ──────────────────────────────────────────

export interface OptimizeResumeProviderResult {
  /** Whether the optimization succeeded. */
  success: true;
  /** The optimized resume snapshot. */
  optimizedResume: ResumeSnapshot;
  /** Changes made during optimization. */
  changes: OptimizationChange[];
  /** Warnings about the optimization. */
  warnings: string[];
}

// ── Provider Interface ───────────────────────────────────────

export interface ResumeOptimizationProvider {
  /** Unique provider identifier (e.g., "groq", "openrouter"). */
  readonly id: string;

  /**
   * Optimize a resume for ATS keyword alignment.
   * Returns structured result with optimized snapshot and change metadata.
   */
  optimizeResume(
    request: OptimizeResumeRequest,
    context?: ProviderRequestContext,
  ): Promise<OptimizeResumeProviderResult>;
}

// ── Provider Manager Result ──────────────────────────────────

export interface OptimizationMetadata {
  /** Prompt version used. */
  promptVersion: string;
  /** Provider that succeeded. */
  providerId: string;
  /** Model used. */
  model: string;
  /** Whether fallback was used. */
  fallbackUsed: boolean;
  /** Total attempts across all providers. */
  attempts: number;
}

export interface OptimizeResumeResult {
  success: true;
  data: {
    optimizedResume: ResumeSnapshot;
    changes: OptimizationChange[];
    warnings: string[];
    metadata: OptimizationMetadata;
  };
}

export interface OptimizeResumeError {
  success: false;
  error: {
    code: ProviderErrorCode;
    message: string;
  };
}

export type OptimizeResumeOperationResult =
  | OptimizeResumeResult
  | OptimizeResumeError;

// ── Retry Policy ─────────────────────────────────────────────

export interface RetryPolicy {
  /** Maximum attempts for the primary provider (including initial). */
  maxPrimaryAttempts: number;
  /** Base delay in ms for exponential backoff. */
  baseDelayMs: number;
  /** Maximum delay cap in ms. */
  maxDelayMs: number;
  /** Maximum total retry duration in ms. */
  maxTotalDurationMs: number;
}

// ── Provider Configuration ───────────────────────────────────

export interface ProviderConfig {
  /** Provider identifier. */
  id: string;
  /** API key (server-only). */
  apiKey: string;
  /** Model identifier. */
  model: string;
  /** Request timeout in ms. */
  timeoutMs: number;
  /** Maximum output tokens. */
  maxOutputTokens?: number;
}

// ── Service Configuration ────────────────────────────────────

export interface OptimizationServiceConfig {
  /** Primary provider configuration. */
  primary: ProviderConfig;
  /** Fallback provider configuration (optional). */
  fallback?: ProviderConfig;
  /** Retry policy. */
  retryPolicy: RetryPolicy;
  /** Prompt version. */
  promptVersion: string;
}
