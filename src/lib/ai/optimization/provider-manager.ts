// ─────────────────────────────────────────────────────────────
// Provider Manager
// ─────────────────────────────────────────────────────────────
// Manages provider selection, bounded retries with exponential
// backoff, and fallback between primary and fallback providers.
// Deterministic order: primary → fallback. No retry storms.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type {
  ResumeOptimizationProvider,
  OptimizeResumeRequest,
  OptimizeResumeProviderResult,
  ProviderError,
  ProviderRequestContext,
  RetryPolicy,
  OptimizationMetadata,
} from "./types";

// ── Manager Result ───────────────────────────────────────────

export interface ProviderManagerResult {
  success: true;
  result: OptimizeResumeProviderResult;
  metadata: OptimizationMetadata;
}

export interface ProviderManagerError {
  success: false;
  error: ProviderError;
  metadata: OptimizationMetadata;
}

export type ProviderManagerOutcome =
  | ProviderManagerResult
  | ProviderManagerError;

// ── Retry Utilities ──────────────────────────────────────────

function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  retryAfterMs?: number,
): number {
  // If Retry-After is provided, use it (capped)
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    return Math.min(retryAfterMs, maxDelayMs);
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.5 + 0.75; // 0.75x to 1.25x
  return Math.min(exponentialDelay * jitter, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Provider Manager ─────────────────────────────────────────

export class ProviderManager {
  private primary: ResumeOptimizationProvider;
  private fallback?: ResumeOptimizationProvider;
  private retryPolicy: RetryPolicy;
  private promptVersion: string;

  constructor(config: {
    primary: ResumeOptimizationProvider;
    fallback?: ResumeOptimizationProvider;
    retryPolicy: RetryPolicy;
    promptVersion: string;
  }) {
    this.primary = config.primary;
    this.fallback = config.fallback;
    this.retryPolicy = config.retryPolicy;
    this.promptVersion = config.promptVersion;
  }

  /**
   * Execute optimization with retry and fallback.
   * Deterministic order: primary → fallback. No cycling.
   */
  async optimize(
    request: OptimizeResumeRequest,
  ): Promise<ProviderManagerOutcome> {
    const metadata: OptimizationMetadata = {
      promptVersion: this.promptVersion,
      providerId: this.primary.id,
      model: "",
      fallbackUsed: false,
      attempts: 0,
    };

    // Attempt primary provider with bounded retries
    const primaryOutcome = await this.attemptProvider(
      this.primary,
      request,
      metadata,
    );

    if (primaryOutcome.success) {
      return primaryOutcome;
    }

    // Check if error is eligible for fallback
    if (!this.shouldFallback(primaryOutcome.error)) {
      return primaryOutcome;
    }

    // Attempt fallback if configured
    if (!this.fallback) {
      return {
        success: false,
        error: {
          code: "all_providers_failed",
          message:
            "Primary provider failed and no fallback is configured.",
          providerId: this.primary.id,
          retryable: false,
        },
        metadata,
      };
    }

    metadata.fallbackUsed = true;
    metadata.providerId = this.fallback.id;

    const fallbackOutcome = await this.attemptProvider(
      this.fallback,
      request,
      metadata,
    );

    if (fallbackOutcome.success) {
      return fallbackOutcome;
    }

    // Both providers failed
    return {
      success: false,
      error: {
        code: "all_providers_failed",
        message: "All configured providers failed.",
        retryable: false,
      },
      metadata,
    };
  }

  /**
   * Attempt a provider with bounded retries.
   */
  private async attemptProvider(
    provider: ResumeOptimizationProvider,
    request: OptimizeResumeRequest,
    metadata: OptimizationMetadata,
  ): Promise<ProviderManagerOutcome> {
    const maxAttempts = this.retryPolicy.maxPrimaryAttempts;
    let lastError: ProviderError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      metadata.attempts++;

      try {
        const context: ProviderRequestContext = {
          timeoutMs: this.retryPolicy.maxTotalDurationMs / maxAttempts,
          promptVersion: this.promptVersion,
        };

        const result = await provider.optimizeResume(request, context);

        // Success
        if (attempt > 1) {
          metadata.model = `${provider.id}:retry-${attempt - 1}`;
        } else {
          metadata.model = provider.id;
        }

        return { success: true, result, metadata };
      } catch (error) {
        lastError = error as ProviderError;

        // Non-retryable error — stop immediately
        if (!lastError.retryable) {
          return {
            success: false,
            error: lastError,
            metadata,
          };
        }

        // Last attempt — don't retry
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate delay with backoff
        const delay = calculateDelay(
          attempt,
          this.retryPolicy.baseDelayMs,
          this.retryPolicy.maxDelayMs,
          (lastError as ProviderError & { retryAfterMs?: number })
            .retryAfterMs,
        );

        await sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError ?? {
        code: "unknown_provider_error",
        message: "All retry attempts exhausted.",
        providerId: provider.id,
        retryable: false,
      },
      metadata,
    };
  }

  /**
   * Determine if an error is eligible for fallback.
   * Only transient/recoverable errors trigger fallback.
   */
  private shouldFallback(error: ProviderError): boolean {
    switch (error.code) {
      case "rate_limited":
      case "provider_unavailable":
      case "timeout":
        return true;
      case "provider_authentication_failed":
      case "unsupported_model":
      case "invalid_request":
      case "configuration_error":
      case "malformed_provider_output":
      case "factual_validation_failed":
        return false;
      case "authentication_required":
      case "all_providers_failed":
      case "unknown_provider_error":
      default:
        return false;
    }
  }
}
