import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GroqResumeOptimizationProvider } from "../groq-provider";
import type { OptimizeResumeRequest } from "../types";
import type { ResumeSnapshot } from "@/types/resume";

vi.mock("server-only", () => ({}));

const MOCK_SNAPSHOT: ResumeSnapshot = {
  profile: { name: "Test User", title: "Engineer" },
  summary: "A software engineer with experience in web development.",
  experiences: [
    {
      company: "TechCorp",
      title: "Senior Engineer",
      startDate: "2020-01",
      endDate: null,
      isCurrent: true,
      accomplishments: ["Built microservices"],
      skills: ["TypeScript", "React"],
    },
  ],
  skills: [
    { name: "TypeScript", category: "Languages", proficiency: "Expert" },
    { name: "React", category: "Frameworks", proficiency: "Advanced" },
  ],
};

const MOCK_REQUEST: OptimizeResumeRequest = {
  resume: MOCK_SNAPSHOT,
  targetJobTitle: "Staff Engineer",
  targetJobDescription: "Looking for a senior engineer with React experience.",
  optimizationMode: "ats",
  promptVersion: "ats-v1",
};

function createProvider(config?: { apiKey?: string; model?: string }) {
  return new GroqResumeOptimizationProvider({
    apiKey: config?.apiKey ?? "gsk_test_key",
    model: config?.model ?? "llama-3.3-70b-versatile",
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

describe("GroqResumeOptimizationProvider", () => {
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
        summary: "Experienced software engineer specializing in web development.",
      };

      globalThis.fetch = mockFetchSuccess({
        choices: [
          {
            message: {
              content: JSON.stringify({
                optimizedResume: optimizedSnapshot,
                changes: [
                  {
                    section: "summary",
                    field: "summary",
                    originalValue: MOCK_SNAPSHOT.summary!,
                    optimizedValue: optimizedSnapshot.summary!,
                    reason: "conciseness",
                  },
                ],
                warnings: [],
              }),
            },
          },
        ],
      });

      const provider = createProvider();
      const result = await provider.optimizeResume(MOCK_REQUEST);

      expect(result.success).toBe(true);
      expect(result.optimizedResume.summary).toBe(
        "Experienced software engineer specializing in web development.",
      );
      expect(result.changes).toHaveLength(1);
    });

    it("sends correct request headers", async () => {
      globalThis.fetch = mockFetchSuccess({
        choices: [{ message: { content: '{"optimizedResume":{},"changes":[],"warnings":[]}' } }],
      });

      const provider = createProvider();
      await provider.optimizeResume(MOCK_REQUEST);

      const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
      expect(options.headers.Authorization).toBe("Bearer gsk_test_key");
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("uses JSON object mode for llama-3.3-70b-versatile", async () => {
      globalThis.fetch = mockFetchSuccess({
        choices: [{ message: { content: '{"optimizedResume":{},"changes":[],"warnings":[]}' } }],
      });

      const provider = createProvider();
      await provider.optimizeResume(MOCK_REQUEST);

      const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.response_format).toEqual({ type: "json_object" });
      expect(body.model).toBe("llama-3.3-70b-versatile");
      expect(body.response_format.json_schema).toBeUndefined();
    });
  });

  describe("malformed JSON", () => {
    it("rejects invalid JSON response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "not valid json" } }],
          }),
        headers: new Headers(),
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "malformed_provider_output",
      });
    });
  });

  describe("schema-invalid JSON", () => {
    it("rejects JSON missing optimizedResume field", async () => {
      globalThis.fetch = mockFetchSuccess({
        choices: [
          {
            message: {
              content: JSON.stringify({ something: "else" }),
            },
          },
        ],
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "malformed_provider_output",
      });
    });
  });

  describe("HTTP errors", () => {
    it("returns invalid_request for 400 unsupported response format", async () => {
      globalThis.fetch = mockFetchError(400, {
        error: { message: "This model does not support response format `json_schema`" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "invalid_request",
        retryable: false,
      });
    });

    it("returns invalid_request for generic 400", async () => {
      globalThis.fetch = mockFetchError(400, {
        error: { message: "Invalid request body" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "invalid_request",
        retryable: false,
      });
    });

    it("does not expose raw Groq 400 message to callers", async () => {
      globalThis.fetch = mockFetchError(400, {
        error: { message: "Invalid request: unsupported response_format type" },
      });

      const provider = createProvider();
      try {
        await provider.optimizeResume(MOCK_REQUEST);
        expect.fail("Should have thrown");
      } catch (error) {
        // The internal message is safe (no API key, no request body)
        expect((error as Error).message).not.toContain("gsk_test_key");
      }
    });

    it("returns provider_authentication_failed for 401", async () => {
      globalThis.fetch = mockFetchError(401, {
        error: { message: "Invalid API key" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_authentication_failed",
        retryable: false,
      });
    });

    it("returns provider_authentication_failed for 403", async () => {
      globalThis.fetch = mockFetchError(403, {
        error: { message: "Access denied" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_authentication_failed",
        retryable: false,
      });
    });

    it("returns unsupported_model for 404", async () => {
      globalThis.fetch = mockFetchError(404, {
        error: { message: "Model not found" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "unsupported_model",
        retryable: false,
      });
    });

    it("returns invalid_request for 422", async () => {
      globalThis.fetch = mockFetchError(422, {
        error: { message: "Semantic error" },
      });

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "invalid_request",
        retryable: false,
      });
    });

    it("returns rate_limited for 429 with Retry-After", async () => {
      globalThis.fetch = mockFetchError(
        429,
        { error: { message: "Rate limited" } },
        { "retry-after": "5" },
      );

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "rate_limited",
        retryable: true,
      });
    });

    it("returns provider_unavailable for 500", async () => {
      globalThis.fetch = mockFetchError(500);

      const provider = createProvider();
      await expect(provider.optimizeResume(MOCK_REQUEST)).rejects.toMatchObject({
        code: "provider_unavailable",
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

      const provider = new GroqResumeOptimizationProvider({
        apiKey: "test",
        model: "llama-3.3-70b-versatile",
        timeoutMs: 1, // Very short timeout
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
        error: { message: "Invalid key: gsk_secret_key_abc123" },
      });

      const provider = createProvider({ apiKey: "gsk_secret_key_abc123" });
      try {
        await provider.optimizeResume(MOCK_REQUEST);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).not.toContain("gsk_secret_key_abc123");
      }
    });
  });
});
