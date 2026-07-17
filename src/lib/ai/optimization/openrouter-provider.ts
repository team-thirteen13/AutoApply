// ─────────────────────────────────────────────────────────────
// OpenRouter Resume Optimization Provider
// ─────────────────────────────────────────────────────────────
// Fallback ATS optimization provider using OpenRouter's API.
// Uses structured JSON output mode where supported.
// Server-only — API key never reaches client code.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type {
  ResumeOptimizationProvider,
  OptimizeResumeRequest,
  OptimizeResumeProviderResult,
  ProviderRequestContext,
  ProviderError,
} from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts/ats-v1";
import { validateProviderOutput } from "./validation";
import { parseRetryAfter } from "./retry-after";

// ── OpenRouter API Types ─────────────────────────────────────

interface OpenRouterChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterChatMessage[];
  response_format?: {
    type: "json_object";
  };
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// ── Provider ─────────────────────────────────────────────────

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterResumeOptimizationProvider
  implements ResumeOptimizationProvider
{
  readonly id = "openrouter";

  private apiKey: string;
  private model: string;
  private timeoutMs: number;
  private maxOutputTokens?: number;

  constructor(config: {
    apiKey: string;
    model: string;
    timeoutMs: number;
    maxOutputTokens?: number;
  }) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeoutMs = config.timeoutMs;
    this.maxOutputTokens = config.maxOutputTokens;
  }

  async optimizeResume(
    request: OptimizeResumeRequest,
    context?: ProviderRequestContext,
  ): Promise<OptimizeResumeProviderResult> {
    const timeoutMs = context?.timeoutMs ?? this.timeoutMs;

    const body: OpenRouterChatRequest = {
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(request) },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.3,
    };

    if (this.maxOutputTokens) {
      body.max_tokens = this.maxOutputTokens;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://autoapply.app",
          "X-Title": "AutoApply ATS Optimizer",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.parseOpenRouterError(response);
      }

      const data: OpenRouterChatResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw {
          code: "malformed_provider_output" as const,
          message: "Provider returned empty response content.",
          providerId: this.id,
          retryable: false,
        };
      }

      return this.parseStructuredOutput(content);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout) — detect AbortError first because
      // DOMException also has a numeric `.code` property
      const isAbort =
        (error as { name?: string } | null)?.name === "AbortError";
      if (isAbort) {
        throw {
          code: "timeout" as const,
          message: `Request timed out after ${timeoutMs}ms.`,
          providerId: this.id,
          retryable: true,
        } satisfies ProviderError;
      }

      // Re-throw ProviderError as-is
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }

      // Network errors
      if (error instanceof TypeError) {
        throw {
          code: "provider_unavailable" as const,
          message: "Network error connecting to provider.",
          providerId: this.id,
          retryable: true,
        } satisfies ProviderError;
      }

      throw {
        code: "unknown_provider_error" as const,
        message: "An unexpected error occurred with the provider.",
        providerId: this.id,
        retryable: true,
      } satisfies ProviderError;
    }
  }

  private async parseOpenRouterError(
    response: Response,
  ): Promise<ProviderError> {
    try {
      await response.json();
    } catch {
      // Response body might not be JSON
    }

    switch (response.status) {
      case 401:
        return {
          code: "provider_authentication_failed",
          message: "Invalid or missing OpenRouter API key.",
          providerId: this.id,
          retryable: false,
        };
      case 402:
        return {
          code: "configuration_error",
          message: "OpenRouter account has insufficient credits.",
          providerId: this.id,
          retryable: false,
        };
      case 404:
        return {
          code: "unsupported_model",
          message: `Model not found: ${this.model}`,
          providerId: this.id,
          retryable: false,
        };
      case 429: {
        const retryAfterMs = parseRetryAfter(
          response.headers.get("retry-after"),
        );
        return {
          code: "rate_limited",
          message: "OpenRouter rate limit exceeded.",
          providerId: this.id,
          retryable: true,
          retryAfterMs,
        };
      }
      case 500:
      case 502:
      case 503:
        return {
          code: "provider_unavailable",
          message: `OpenRouter server error (${response.status}).`,
          providerId: this.id,
          retryable: true,
        };
      default:
        return {
          code: "unknown_provider_error",
          message: `Unexpected OpenRouter error (${response.status}).`,
          providerId: this.id,
          retryable: response.status >= 500,
        };
    }
  }

  private parseStructuredOutput(
    content: string,
  ): OptimizeResumeProviderResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw {
        code: "malformed_provider_output" as const,
        message: "Provider returned invalid JSON.",
        providerId: this.id,
        retryable: false,
      } satisfies ProviderError;
    }

    const validation = validateProviderOutput(parsed);
    if (!validation.valid) {
      throw {
        code: "malformed_provider_output" as const,
        message: "Provider output failed schema validation.",
        providerId: this.id,
        retryable: false,
      } satisfies ProviderError;
    }

    return {
      success: true,
      optimizedResume: validation.data.optimizedResume,
      changes: (validation.data.changes ?? []).map((c) => ({
        ...c,
        reason: c.reason as import("./types").ChangeReasonCategory,
      })),
      warnings: validation.data.warnings ?? [],
    };
  }
}
