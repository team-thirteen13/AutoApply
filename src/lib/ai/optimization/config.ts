// ─────────────────────────────────────────────────────────────
// Optimization Service Configuration
// ─────────────────────────────────────────────────────────────
// Server-only environment validation for AI provider config.
// Validates API keys, models, timeouts, and retry settings.
// Fails fast with clear errors if configuration is invalid.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type {
  OptimizationServiceConfig,
  ProviderConfig,
  RetryPolicy,
} from "./types";

// ── Bounds ───────────────────────────────────────────────────

const MIN_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 30_000;

const MIN_RETRIES = 0;
const MAX_RETRIES = 5;
const DEFAULT_RETRIES = 2;

const MIN_OUTPUT_TOKENS = 256;
const MAX_OUTPUT_TOKENS = 16_384;

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 10_000;
const MAX_TOTAL_DURATION_MS = 60_000;

// ── Helpers ──────────────────────────────────────────────────

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() || undefined;
}

function readEnvInt(key: string, fallback: number): number {
  const raw = readEnv(key);
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(
      `Invalid numeric value for ${key}: "${raw}". Expected an integer.`,
    );
  }
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── Provider Config ──────────────────────────────────────────

function buildProviderConfig(
  prefix: string,
  id: string,
): ProviderConfig | undefined {
  const apiKey = readEnv(`${prefix}_API_KEY`);
  if (!apiKey) return undefined;

  const model =
    readEnv("AI_MODEL") ?? readEnv(`${prefix}_MODEL`) ?? defaultModel(id);
  const timeoutMs = clamp(
    readEnvInt("AI_REQUEST_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    MIN_TIMEOUT_MS,
    MAX_TIMEOUT_MS,
  );

  const maxOutputTokensRaw = readEnvInt("AI_MAX_OUTPUT_TOKENS", 0);
  const maxOutputTokens =
    maxOutputTokensRaw > 0
      ? clamp(maxOutputTokensRaw, MIN_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS)
      : undefined;

  return { id, apiKey, model, timeoutMs, maxOutputTokens };
}

function defaultModel(id: string): string {
  switch (id) {
    case "groq":
      return "llama-3.3-70b-versatile";
    case "openrouter":
      return "meta-llama/llama-3.3-70b-instruct";
    default:
      throw new Error(`No default model defined for provider "${id}".`);
  }
}

// ── Retry Policy ─────────────────────────────────────────────

function buildRetryPolicy(): RetryPolicy {
  const maxPrimaryAttempts = clamp(
    readEnvInt("AI_MAX_RETRIES", DEFAULT_RETRIES) + 1, // retries + initial attempt
    MIN_RETRIES + 1,
    MAX_RETRIES + 1,
  );

  return {
    maxPrimaryAttempts,
    baseDelayMs: BASE_DELAY_MS,
    maxDelayMs: MAX_DELAY_MS,
    maxTotalDurationMs: MAX_TOTAL_DURATION_MS,
  };
}

// ── Service Config ───────────────────────────────────────────

function resolveProviderId(envVar: string | undefined): string | undefined {
  const raw = envVar?.trim().toLowerCase();
  if (!raw || raw === "mock") return undefined;
  return raw;
}

/**
 * Build the optimization service configuration from environment variables.
 *
 * Returns `null` when AI_PROVIDER is "mock" or unset — meaning the mock
 * provider should be used instead of real providers.
 *
 * Throws if a real provider is selected but its configuration is incomplete.
 */
export function buildOptimizationConfig(): OptimizationServiceConfig | null {
  const providerId = resolveProviderId(readEnv("AI_PROVIDER"));

  // Mock mode — no real provider needed
  if (!providerId) {
    const fallbackId = resolveProviderId(readEnv("AI_FALLBACK_PROVIDER"));
    if (fallbackId) {
      throw new Error(
        "Fallback provider configured but AI_PROVIDER is mock/unset. " +
          "Set AI_PROVIDER to a real provider to use fallback.",
      );
    }
    return null;
  }

  // Build primary provider config
  const primary = buildPrimaryProviderConfig(providerId);
  if (!primary) {
    throw new Error(
      `AI_PROVIDER is "${providerId}" but ${providerId.toUpperCase()}_API_KEY is missing.`,
    );
  }

  // Build optional fallback provider config
  const fallback = buildFallbackConfig();

  const retryPolicy = buildRetryPolicy();
  const promptVersion = readEnv("AI_PROMPT_VERSION") ?? "ats-v1";

  return { primary, fallback, retryPolicy, promptVersion };
}

function buildPrimaryProviderConfig(
  providerId: string,
): ProviderConfig | undefined {
  switch (providerId) {
    case "groq":
      return buildProviderConfig("GROQ", "groq");
    case "openrouter":
      return buildProviderConfig("OPENROUTER", "openrouter");
    default:
      throw new Error(
        `Unsupported AI_PROVIDER: "${providerId}". Supported: groq, openrouter.`,
      );
  }
}

function buildFallbackConfig(): ProviderConfig | undefined {
  const fallbackId = resolveProviderId(readEnv("AI_FALLBACK_PROVIDER"));
  if (!fallbackId) return undefined;

  switch (fallbackId) {
    case "groq": {
      const config = buildProviderConfig("GROQ", "groq");
      if (!config) {
        throw new Error(
          "AI_FALLBACK_PROVIDER is groq but GROQ_API_KEY is missing.",
        );
      }
      return config;
    }
    case "openrouter": {
      const config = buildProviderConfig("OPENROUTER", "openrouter");
      if (!config) {
        throw new Error(
          "AI_FALLBACK_PROVIDER is openrouter but OPENROUTER_API_KEY is missing.",
        );
      }
      return config;
    }
    default:
      throw new Error(
        `Unsupported AI_FALLBACK_PROVIDER: "${fallbackId}". Supported: groq, openrouter.`,
      );
  }
}

// ── Singleton ────────────────────────────────────────────────

let _config: OptimizationServiceConfig | null | undefined;

/**
 * Get the cached optimization service configuration.
 * Returns `null` when in mock mode.
 * Throws on first access if environment is invalid.
 */
export function getOptimizationConfig(): OptimizationServiceConfig | null {
  if (_config === undefined) {
    _config = buildOptimizationConfig();
  }
  return _config;
}

/**
 * Reset the cached configuration. For testing only.
 */
export function resetOptimizationConfig(): void {
  _config = undefined;
}
