// ─────────────────────────────────────────────────────────────
// Generate Resume Content
// ─────────────────────────────────────────────────────────────
// Orchestrates resume generation using an AIProvider.
// Validates input, invokes the provider, and maps errors.
// No database writes — pure input → provider → output.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type { AIProvider, GenerateResumeInput, GenerateResumeOutput } from "@/lib/ai/types";
import { generateResumeSchema } from "@/lib/validation/ai";

// ── Error types ─────────────────────────────────────────────

export interface GenerateResumeError {
  code: GenerateResumeErrorCode;
  message: string;
}

export type GenerateResumeErrorCode =
  | "validation_error"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_provider_response"
  | "unexpected";

export type GenerateResumeOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: GenerateResumeError };

// ── Generation service ──────────────────────────────────────

export async function generateResumeContent(
  provider: AIProvider,
  input: GenerateResumeInput,
): Promise<GenerateResumeOperationResult<GenerateResumeOutput>> {
  try {
    // 1. Validate input
    const validation = generateResumeSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: "validation_error",
          message: validation.error.issues[0]?.message ?? "Invalid input",
        },
      };
    }

    // 2. Invoke provider
    let result;
    try {
      result = await provider.generateResume(validation.data);
    } catch {
      return {
        success: false,
        error: {
          code: "provider_unavailable",
          message: "AI provider is currently unavailable",
        },
      };
    }

    // 3. Validate provider response
    if (!result || !result.data || !result.data.snapshot) {
      return {
        success: false,
        error: {
          code: "invalid_provider_response",
          message: "Provider returned an invalid response",
        },
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      error: {
        code: "unexpected",
        message: "An unexpected error occurred during generation",
      },
    };
  }
}
