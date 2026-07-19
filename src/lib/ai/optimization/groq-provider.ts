// ─────────────────────────────────────────────────────────────
// Groq Resume Optimization Provider
// ─────────────────────────────────────────────────────────────
// Primary ATS optimization provider using Groq's API.
// Uses structured JSON output mode for reliable parsing.
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

// ── Groq API Types ───────────────────────────────────────────

interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChatRequest {
  model: string;
  messages: GroqChatMessage[];
  response_format?: {
    type: "json_object";
  };
  max_completion_tokens?: number;
  temperature?: number;
}

interface GroqChatResponse {
  id: string;
  object: string;
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

interface GroqErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

// ── Provider ─────────────────────────────────────────────────

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export class GroqResumeOptimizationProvider
  implements ResumeOptimizationProvider
{
  readonly id = "groq";

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

    const body: GroqChatRequest = {
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(request) },
      ],
      // Groq llama-3.3-70b-versatile supports json_object mode only.
      // json_schema is not supported by this model (returns HTTP 400).
      // Runtime Zod validation in parseStructuredOutput enforces the schema.
      response_format: {
        type: "json_object",
      },
      temperature: 0.3,
    };

    if (this.maxOutputTokens) {
      body.max_completion_tokens = this.maxOutputTokens;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.parseGroqError(response);
      }

      const data: GroqChatResponse = await response.json();
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

  private async parseGroqError(
    response: Response,
  ): Promise<ProviderError> {
    let errorBody: GroqErrorResponse = {};
    try {
      errorBody = await response.json();
    } catch {
      // Response body might not be JSON
    }

    const message =
      errorBody.error?.message ?? `HTTP ${response.status}`;

    switch (response.status) {
      case 400:
        return {
          code: "invalid_request",
          message: `Invalid request: ${message}`,
          providerId: this.id,
          retryable: false,
        };
      case 401:
        return {
          code: "provider_authentication_failed",
          message: "Invalid or missing Groq API key.",
          providerId: this.id,
          retryable: false,
        };
      case 403:
        return {
          code: "provider_authentication_failed",
          message: "Groq API access denied.",
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
      case 422:
        return {
          code: "invalid_request",
          message: `Invalid request: ${message}`,
          providerId: this.id,
          retryable: false,
        };
      case 429: {
        const retryAfterMs = parseRetryAfter(
          response.headers.get("retry-after"),
        );
        return {
          code: "rate_limited",
          message: "Groq rate limit exceeded.",
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
          message: `Groq server error (${response.status}).`,
          providerId: this.id,
          retryable: true,
        };
      default:
        return {
          code: "unknown_provider_error",
          message: `Unexpected Groq error (${response.status}).`,
          providerId: this.id,
          retryable: response.status >= 500,
        };
    }
  }

  /**
   * Normalize Groq json_object output to match the expected Zod schema.
   *
   * Groq's json_object mode does not enforce a schema, so the model may
   * return structures that differ from the expected format:
   * - changes: invalid reason enum values, or { section, description } format
   * - warnings: objects with { section, description } instead of plain strings
   * - profile: extra fields (linkedin, github, location) or missing required fields
   */
  private normalizeOutput(parsed: unknown): unknown {
    if (!parsed || typeof parsed !== "object") return parsed;

    const obj = parsed as Record<string, unknown>;
    const result: Record<string, unknown> = { ...obj };

    // Normalize changes array
    if (Array.isArray(result.changes)) {
      result.changes = result.changes.map((change: unknown) => {
        if (!change || typeof change !== "object") return change;
        const c = change as Record<string, unknown>;
        // If change has `description` but missing `field`/`originalValue`/`optimizedValue`/`reason`
        if (c.description && !c.field) {
          return {
            section: c.section ?? "unknown",
            field: "summary",
            originalValue: "",
            optimizedValue: String(c.description),
            reason: "conciseness",
          };
        }
        // Map invalid reason enum values to valid ones
        if (c.reason && typeof c.reason === "string") {
          const validReasons = [
            "keyword_alignment", "action_verbs", "conciseness",
            "tense_consistency", "terminology", "readability",
            "filler_removal", "skill_organization", "summary_relevance",
            "bullet_clarity",
          ];
          if (!validReasons.includes(c.reason)) {
            // Map common Groq reason patterns to valid enum values
            const reason = c.reason.toLowerCase();
            if (reason.includes("keyword") || reason.includes("ats")) c.reason = "keyword_alignment";
            else if (reason.includes("action") || reason.includes("verb")) c.reason = "action_verbs";
            else if (reason.includes("concise") || reason.includes("brief")) c.reason = "conciseness";
            else if (reason.includes("tense")) c.reason = "tense_consistency";
            else if (reason.includes("terminolog") || reason.includes("align")) c.reason = "terminology";
            else if (reason.includes("readab") || reason.includes("flow")) c.reason = "readability";
            else if (reason.includes("filler") || reason.includes("remove")) c.reason = "filler_removal";
            else if (reason.includes("skill") || reason.includes("organiz")) c.reason = "skill_organization";
            else if (reason.includes("summary") || reason.includes("relevance")) c.reason = "summary_relevance";
            else if (reason.includes("bullet") || reason.includes("clarity")) c.reason = "bullet_clarity";
            else c.reason = "conciseness"; // default fallback
          }
        }
        return c;
      });
    }

    // Normalize warnings array — objects with { section, description } → strings
    if (Array.isArray(result.warnings)) {
      result.warnings = result.warnings.map((w: unknown) => {
        if (w && typeof w === "object") {
          const wObj = w as Record<string, unknown>;
          return String(wObj.description ?? wObj.message ?? JSON.stringify(w));
        }
        return w;
      });
    }

    // Ensure profile has required fields and remove extra fields
    if (result.optimizedResume && typeof result.optimizedResume === "object") {
      const resume = result.optimizedResume as Record<string, unknown>;
      if (resume.profile && typeof resume.profile === "object") {
        const profile = resume.profile as Record<string, unknown>;
        // Map Groq field names to expected schema field names
        if (profile.linkedin && !profile.linkedinUrl) profile.linkedinUrl = profile.linkedin;
        if (profile.github && !profile.githubUrl) profile.githubUrl = profile.github;
        // Remove extra fields not in schema
        delete profile.linkedin;
        delete profile.github;
        delete profile.location;
        // Ensure required fields exist with correct types
        if (!profile.title) profile.title = "";
        if (profile.phone === undefined) profile.phone = null;
        if (profile.city === undefined) profile.city = null;
        if (profile.country === undefined) profile.country = null;
        if (profile.bio === undefined) profile.bio = null;
        if (profile.githubUrl === undefined) profile.githubUrl = null;
        if (profile.linkedinUrl === undefined) profile.linkedinUrl = null;
        if (profile.portfolioUrl === undefined) profile.portfolioUrl = null;
      }
      // Ensure arrays exist
      if (!resume.experiences) resume.experiences = [];
      if (!resume.education) resume.education = [];
      if (!resume.projects) resume.projects = [];
      if (!resume.certificates) resume.certificates = [];
      if (!resume.skills) resume.skills = [];
      if (!resume.languages) resume.languages = [];
    }

    return result;
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

    // Normalize Groq json_object output to match the expected schema.
    // Groq may return changes as { section, description } instead of
    // { section, field, originalValue, optimizedValue, reason }.
    // Warnings may be objects instead of strings.
    const normalized = this.normalizeOutput(parsed);

    const validation = validateProviderOutput(normalized);
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
