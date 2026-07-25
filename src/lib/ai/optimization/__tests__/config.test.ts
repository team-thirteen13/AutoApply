import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildOptimizationConfig,
  resetOptimizationConfig,
} from "../config";

vi.mock("server-only", () => ({}));

describe("Optimization Config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetOptimizationConfig();
    // Reset env to clean state
    process.env = { ...originalEnv };
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.AI_FALLBACK_PROVIDER;
    delete process.env.AI_FALLBACK_MODEL;
    delete process.env.AI_REQUEST_TIMEOUT_MS;
    delete process.env.AI_MAX_RETRIES;
    delete process.env.AI_MAX_OUTPUT_TOKENS;
    delete process.env.AI_PROMPT_VERSION;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  describe("mock mode", () => {
    it("returns null when AI_PROVIDER is unset", () => {
      const config = buildOptimizationConfig();
      expect(config).toBeNull();
    });

    it("returns null when AI_PROVIDER is 'mock'", () => {
      process.env.AI_PROVIDER = "mock";
      const config = buildOptimizationConfig();
      expect(config).toBeNull();
    });

    it("rejects fallback when AI_PROVIDER is mock", () => {
      process.env.AI_PROVIDER = "mock";
      process.env.AI_FALLBACK_PROVIDER = "openrouter";
      expect(() => buildOptimizationConfig()).toThrow(
        "Fallback provider configured but AI_PROVIDER is mock/unset",
      );
    });
  });

  describe("Groq configuration", () => {
    it("builds valid Groq config", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "gsk_test_key_123";
      const config = buildOptimizationConfig();

      expect(config).not.toBeNull();
      expect(config!.primary.id).toBe("groq");
      expect(config!.primary.apiKey).toBe("gsk_test_key_123");
      expect(config!.primary.model).toBe("llama-3.3-70b-versatile");
      expect(config!.primary.timeoutMs).toBe(30000);
    });

    it("throws when GROQ_API_KEY is missing", () => {
      process.env.AI_PROVIDER = "groq";
      expect(() => buildOptimizationConfig()).toThrow(
        'AI_PROVIDER is "groq" but GROQ_API_KEY is missing',
      );
    });

    it("uses custom model when AI_MODEL is set", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_MODEL = "custom-model";
      const config = buildOptimizationConfig();
      expect(config!.primary.model).toBe("custom-model");
    });

    it("clamps timeout to safe bounds", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_REQUEST_TIMEOUT_MS = "1000"; // Below minimum
      const config = buildOptimizationConfig();
      expect(config!.primary.timeoutMs).toBe(5000); // Clamped to min
    });

    it("clamps timeout to max", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_REQUEST_TIMEOUT_MS = "200000"; // Above maximum
      const config = buildOptimizationConfig();
      expect(config!.primary.timeoutMs).toBe(120000); // Clamped to max
    });

    it("sets maxOutputTokens when configured", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_MAX_OUTPUT_TOKENS = "4096";
      const config = buildOptimizationConfig();
      expect(config!.primary.maxOutputTokens).toBe(4096);
    });

    it("omits maxOutputTokens when not configured", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      const config = buildOptimizationConfig();
      expect(config!.primary.maxOutputTokens).toBeUndefined();
    });
  });

  describe("OpenRouter fallback configuration", () => {
    it("builds valid fallback config", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_FALLBACK_PROVIDER = "openrouter";
      process.env.OPENROUTER_API_KEY = "or_test_key";
      const config = buildOptimizationConfig();

      expect(config!.fallback).toBeDefined();
      expect(config!.fallback!.id).toBe("openrouter");
      expect(config!.fallback!.apiKey).toBe("or_test_key");
      expect(config!.fallback!.model).toBe(
        "meta-llama/llama-3.3-70b-instruct",
      );
    });

    it("omits fallback when AI_FALLBACK_PROVIDER is unset", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      const config = buildOptimizationConfig();
      expect(config!.fallback).toBeUndefined();
    });

    it("throws when fallback key is missing", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_FALLBACK_PROVIDER = "openrouter";
      expect(() => buildOptimizationConfig()).toThrow(
        "AI_FALLBACK_PROVIDER is openrouter but OPENROUTER_API_KEY is missing",
      );
    });

    it("throws for unsupported provider", () => {
      process.env.AI_PROVIDER = "unsupported";
      expect(() => buildOptimizationConfig()).toThrow(
        'Unsupported AI_PROVIDER: "unsupported"',
      );
    });

    it("throws for unsupported fallback provider", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_FALLBACK_PROVIDER = "unsupported";
      expect(() => buildOptimizationConfig()).toThrow(
        'Unsupported AI_FALLBACK_PROVIDER: "unsupported"',
      );
    });
  });

  describe("retry policy", () => {
    it("builds default retry policy", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      const config = buildOptimizationConfig();

      expect(config!.retryPolicy.maxPrimaryAttempts).toBe(3); // 2 retries + 1 initial
      expect(config!.retryPolicy.baseDelayMs).toBe(1000);
      expect(config!.retryPolicy.maxDelayMs).toBe(10000);
      expect(config!.retryPolicy.maxTotalDurationMs).toBe(60000);
    });

    it("uses custom retry count", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_MAX_RETRIES = "4";
      const config = buildOptimizationConfig();
      expect(config!.retryPolicy.maxPrimaryAttempts).toBe(5); // 4 retries + 1 initial
    });

    it("clamps invalid retry value", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_MAX_RETRIES = "100";
      const config = buildOptimizationConfig();
      expect(config!.retryPolicy.maxPrimaryAttempts).toBe(6); // Clamped to max
    });

    it("uses custom prompt version", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_PROMPT_VERSION = "ats-v1";
      const config = buildOptimizationConfig();
      expect(config!.promptVersion).toBe("ats-v1");
    });

    it("defaults prompt version to ats-v1", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      const config = buildOptimizationConfig();
      expect(config!.promptVersion).toBe("ats-v1");
    });
  });

  describe("invalid configuration", () => {
    it("throws for non-numeric timeout", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_REQUEST_TIMEOUT_MS = "not-a-number";
      expect(() => buildOptimizationConfig()).toThrow(
        'Invalid numeric value for AI_REQUEST_TIMEOUT_MS',
      );
    });

    it("throws for non-numeric retry count", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_MAX_RETRIES = "abc";
      expect(() => buildOptimizationConfig()).toThrow(
        'Invalid numeric value for AI_MAX_RETRIES',
      );
    });
  });

  describe("prompt version validation", () => {
    it("accepts supported prompt version", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_PROMPT_VERSION = "ats-v1";
      const config = buildOptimizationConfig();
      expect(config!.promptVersion).toBe("ats-v1");
    });

    it("throws for unsupported prompt version", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_PROMPT_VERSION = "ats-v99";
      expect(() => buildOptimizationConfig()).toThrow(
        'Unsupported AI_PROMPT_VERSION: "ats-v99"',
      );
    });

    it("throws for arbitrary prompt version", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test";
      process.env.AI_PROMPT_VERSION = "evil-version";
      expect(() => buildOptimizationConfig()).toThrow(
        'Unsupported AI_PROMPT_VERSION',
      );
    });
  });
});
