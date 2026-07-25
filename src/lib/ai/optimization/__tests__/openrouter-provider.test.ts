import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterResumeOptimizationProvider } from "../openrouter-provider";
import type { OptimizeResumeRequest } from "../types";
import type { ResumeSnapshot } from "@/types/resume";

vi.mock("server-only", () => ({}));

const MOCK_SNAPSHOT: ResumeSnapshot = {
  profile: { name: "Test User", title: "Engineer" },
  summary: "A software engineer.",
  experiences: [
    {
      company: "TechCorp",
      title: "Engineer",
      startDate: "2020-01",
      endDate: null,
      isCurrent: true,
      accomplishments: ["Built things"],
      skills: ["TypeScript"],
    },
  ],
};

const MOCK_REQUEST: OptimizeResumeRequest = {
  resume: MOCK_SNAPSHOT,
  optimizationMode: "ats",
  promptVersion: "ats-v1",
};

function createProvider() {
  return new OpenRouterResumeOptimizationProvider({
    apiKey: "or_test_key",
    model: "meta-llama/llama-3.3-70b-instruct",
    timeoutMs: 30000,
  });
}

function mockFetchSuccess(responseBody: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(responseBody),
    headers: new Headers(),
  });
}

function mockFetchError(
  status: number,
  body?: object,
  headers?: Record<string, string>,
) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body ?? { error: { message: "Error" } }),
    headers: new Headers(headers),
  });
}

describe("OpenRouterResumeOptimizationProvider", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("structured success", () => {
    it("returns optimized resume on valid response", async () => {
      const optimizedSnapshot: ResumeSnapshot = {
        ...MOCK_SNAPSHOT,
        summary: "Experienced software engineer.",
      };

      globalThis.fetch = mockFetchSuccess({
        choices: [
          {
            message: {
              content: JSON.stringify({
                optimizedResume: optimizedSnapshot,
                changes: [],
                warnings: [],
              }),
            },
          },
        ],
      });

      const provider = createProvider();
      const result = await provider.optimizeResume(MOCK_REQUEST);

      expect(result.success).toBe(true);
      expect(result.optimizedResume.summary).toBe("Experienced software engineer.");
    });

    it("sends correct headers including OpenRouter-specific ones", async () => {
      globalThis.fetch = mockFetchSuccess({
        choices: [{ message: { content: '{"optimizedResume":{},"changes":[],"warnings":[]}' } }],
      });

      const provider = createProvider();
      await provider.optimizeResume(MOCK_REQUEST);

      const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options.headers.Authorization).toBe("Bearer or_test_key");
      expect(options.headers["HTTP-Referer"]).toBe("https://autoapply.app");
      expect(options.headers["X-Title"]).toBe("AutoApply ATS Optimizer");
    });

    it("uses json_object response format", async () => {
      globalThis.fetch = mockFetchSuccess({
        choices: [{ message: { content: '{"optimizedResume":{},"changes":[],"warnings":[]}' } }],
      });

      const provider = createProvider();
      await provider.optimizeResume(MOCK_REQUEST);

      const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.response_format.type).toBe("json_object");
    });
  });

  describe("malformed JSON", () => {
    it("rejects invalid JSON response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "not json" } }],
          }),
        headers: new Headers(),
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "malformed_provider_output",
      });
    });
  });

  describe("HTTP errors", () => {
    it("returns provider_authentication_failed for 401", async () => {
      globalThis.fetch = mockFetchError(401);
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_authentication_failed",
        retryable: false,
      });
    });

    it("returns configuration_error for 402", async () => {
      globalThis.fetch = mockFetchError(402);
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "configuration_error",
        retryable: false,
      });
    });

    it("returns unsupported_model for 404", async () => {
      globalThis.fetch = mockFetchError(404);
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "unsupported_model",
        retryable: false,
      });
    });

    it("returns rate_limited for 429", async () => {
      globalThis.fetch = mockFetchError(
        429,
        { error: { message: "Rate limited" } },
        { "retry-after": "3" },
      );
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "rate_limited",
        retryable: true,
      });
    });

    it("returns provider_unavailable for 502", async () => {
      globalThis.fetch = mockFetchError(502);
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_unavailable",
        retryable: true,
      });
    });

    it("returns provider_unavailable for 503", async () => {
      globalThis.fetch = mockFetchError(503);
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_unavailable",
        retryable: true,
      });
    });
  });

  describe("timeout", () => {
    it("returns timeout error when request is aborted", async () => {
      // Mock fetch to simulate a slow response that gets aborted
      globalThis.fetch = vi.fn().mockImplementation((_url: string, opts: { signal?: AbortSignal }) => {
        return new Promise((_, reject) => {
          if (opts.signal) {
            opts.signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted", "AbortError"));
            });
          }
        });
      });

      const provider = new OpenRouterResumeOptimizationProvider({
        apiKey: "test",
        model: "test-model",
        timeoutMs: 1,
      });

      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "timeout",
        retryable: true,
      });
    });
  });

  describe("network error", () => {
    it("returns provider_unavailable for network error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_unavailable",
        retryable: true,
      });
    });
  });

  describe("no raw error leakage", () => {
    it("does not expose API key in error messages", async () => {
      globalThis.fetch = mockFetchError(401, {
        error: { message: "Invalid key" },
      });
      const provider = createProvider();
      try {
        await provider.optimizeResume(MOCK_REQUEST);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).not.toContain("or_test_key");
      }
    });
  });
});
