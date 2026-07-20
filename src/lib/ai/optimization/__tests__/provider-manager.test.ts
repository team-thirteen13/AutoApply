import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProviderManager } from "../provider-manager";
import type {
  ResumeOptimizationProvider,
  OptimizeResumeRequest,
  OptimizeResumeProviderResult,
  ProviderError,
  RetryPolicy,
} from "../types";
import type { ResumeSnapshot } from "@/types/resume";

vi.mock("server-only", () => ({}));

const MOCK_SNAPSHOT: ResumeSnapshot = {
  profile: { name: "Test User" },
  summary: "Engineer",
};

const MOCK_REQUEST: OptimizeResumeRequest = {
  resume: MOCK_SNAPSHOT,
  optimizationMode: "ats",
  promptVersion: "ats-v1",
};

const SUCCESS_RESULT: OptimizeResumeProviderResult = {
  success: true,
  optimizedResume: { ...MOCK_SNAPSHOT, summary: "Optimized engineer" },
  changes: [],
  warnings: [],
};

const RETRY_POLICY: RetryPolicy = {
  maxPrimaryAttempts: 3,
  baseDelayMs: 10, // Very fast for tests
  maxDelayMs: 50,
  maxTotalDurationMs: 1000,
};

function createMockProvider(
  id: string,
  responses: Array<{ success: boolean; error?: ProviderError }>,
): ResumeOptimizationProvider {
  let callCount = 0;
  return {
    id,
    optimizeResume: vi.fn(async () => {
      const response = responses[callCount++] ?? responses[responses.length - 1];
      if (response.success) {
        return SUCCESS_RESULT;
      }
      throw response.error!;
    }),
  } as unknown as ResumeOptimizationProvider;
}

function createSuccessfulProvider(id = "groq"): ResumeOptimizationProvider {
  return createMockProvider(id, [{ success: true }]);
}

function createFailingProvider(
  id: string,
  error: ProviderError,
  times?: number,
): ResumeOptimizationProvider {
  const responses = Array(times ?? 10)
    .fill(null)
    .map(() => ({ success: false, error }));
  return createMockProvider(id, responses);
}

describe("ProviderManager", () => {
  // Increase timeout for tests that involve delays
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("primary succeeds immediately", () => {
    it("returns success without fallback", async () => {
      const primary = createSuccessfulProvider("groq");
      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.providerId).toBe("groq");
        expect(result.metadata.fallbackUsed).toBe(false);
        expect(result.metadata.attempts).toBe(1);
      }
      expect(fallback.optimizeResume).not.toHaveBeenCalled();
    });
  });

  describe("primary succeeds after one retry", () => {
    it("retries and succeeds", async () => {
      const primary = createMockProvider("groq", [
        {
          success: false,
          error: {
            code: "rate_limited",
            message: "Rate limited",
            retryable: true,
          },
        },
        { success: true },
      ]);

      const manager = new ProviderManager({
        primary,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.attempts).toBe(2);
      }
    });
  });

  describe("primary succeeds after two retries", () => {
    it("retries twice and succeeds", async () => {
      const primary = createMockProvider("groq", [
        {
          success: false,
          error: {
            code: "provider_unavailable",
            message: "Unavailable",
            retryable: true,
          },
        },
        {
          success: false,
          error: {
            code: "provider_unavailable",
            message: "Unavailable",
            retryable: true,
          },
        },
        { success: true },
      ]);

      const manager = new ProviderManager({
        primary,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.attempts).toBe(3);
      }
    });
  });

  describe("retries stop at configured bound", () => {
    it("stops after max attempts", async () => {
      const primary = createFailingProvider(
        "groq",
        {
          code: "rate_limited",
          message: "Rate limited",
          retryable: true,
        },
        10,
      );

      const manager = new ProviderManager({
        primary,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 3 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.metadata.attempts).toBe(3);
      }
    });
  });

  describe("Retry-After respected", () => {
    it("uses Retry-After for delay calculation", async () => {
      const primary = createMockProvider("groq", [
        {
          success: false,
          error: {
            code: "rate_limited",
            message: "Rate limited",
            retryable: true,
            retryAfterMs: 20,
          } as ProviderError & { retryAfterMs: number },
        },
        { success: true },
      ]);

      const manager = new ProviderManager({
        primary,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const resultPromise = manager.optimize(MOCK_REQUEST);

      // Advance timers to trigger the retry
      await vi.advanceTimersByTimeAsync(50);

      const result = await resultPromise;

      expect(result.success).toBe(true);
    });
  });

  describe("non-retryable error does not retry", () => {
    it("stops immediately on auth error", async () => {
      const primary = createFailingProvider(
        "groq",
        {
          code: "provider_authentication_failed",
          message: "Invalid key",
          retryable: false,
        },
        10,
      );

      const manager = new ProviderManager({
        primary,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("provider_authentication_failed");
        expect(result.metadata.attempts).toBe(1);
      }
    });
  });

  describe("fallback behavior", () => {
    it("uses fallback when primary rate-limited", async () => {
      const primary = createFailingProvider("groq", {
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });
      // Override to fail all primary attempts
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });

      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 1 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.fallbackUsed).toBe(true);
        expect(result.metadata.providerId).toBe("openrouter");
      }
    });

    it("uses fallback when primary times out", async () => {
      const primary = createFailingProvider("groq", {
        code: "timeout",
        message: "Timed out",
        retryable: true,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "timeout",
        message: "Timed out",
        retryable: true,
      });

      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 1 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.fallbackUsed).toBe(true);
      }
    });

    it("uses fallback when primary 503", async () => {
      const primary = createFailingProvider("groq", {
        code: "provider_unavailable",
        message: "Service unavailable",
        retryable: true,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "provider_unavailable",
        message: "Service unavailable",
        retryable: true,
      });

      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 1 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
    });

    it("does not fall back for invalid API key", async () => {
      const primary = createFailingProvider("groq", {
        code: "provider_authentication_failed",
        message: "Invalid key",
        retryable: false,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "provider_authentication_failed",
        message: "Invalid key",
        retryable: false,
      });

      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("provider_authentication_failed");
        expect(result.metadata.fallbackUsed).toBe(false);
      }
    });

    it("does not fall back for invalid input", async () => {
      const primary = createFailingProvider("groq", {
        code: "invalid_request",
        message: "Bad request",
        retryable: false,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "invalid_request",
        message: "Bad request",
        retryable: false,
      });

      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("invalid_request");
        expect(result.metadata.fallbackUsed).toBe(false);
      }
    });

    it("returns all_providers_failed when fallback disabled and primary fails", async () => {
      const primary = createFailingProvider("groq", {
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });

      const manager = new ProviderManager({
        primary,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 1 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("all_providers_failed");
      }
    });

    it("returns all_providers_failed when both fail", async () => {
      const primary = createFailingProvider("groq", {
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });
      (primary.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });

      const fallback = createFailingProvider("openrouter", {
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });
      (fallback.optimizeResume as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: "rate_limited",
        message: "Rate limited",
        retryable: true,
      });

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: { ...RETRY_POLICY, maxPrimaryAttempts: 1 },
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("all_providers_failed");
        expect(result.metadata.fallbackUsed).toBe(true);
      }
    });

    it("primary success never invokes fallback", async () => {
      const primary = createSuccessfulProvider("groq");
      const fallback = createSuccessfulProvider("openrouter");

      const manager = new ProviderManager({
        primary,
        fallback,
        retryPolicy: RETRY_POLICY,
        promptVersion: "ats-v1",
      });

      const result = await manager.optimize(MOCK_REQUEST);

      expect(result.success).toBe(true);
      expect(fallback.optimizeResume).not.toHaveBeenCalled();
    });
  });
});
