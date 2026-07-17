// ─────────────────────────────────────────────────────────────
// ATS Resume Optimization Action Tests
// ─────────────────────────────────────────────────────────────
// Tests for the server action that optimizes resumes for ATS.
// Mocks authentication and optimization service.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResumeSnapshot } from "@/types/resume";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ai/optimization/groq-provider", () => ({
  GroqResumeOptimizationProvider: vi.fn().mockImplementation(function () {
    return { id: "groq", optimizeResume: vi.fn() };
  }),
}));

vi.mock("@/lib/ai/optimization/openrouter-provider", () => ({
  OpenRouterResumeOptimizationProvider: vi.fn().mockImplementation(function () {
    return { id: "openrouter", optimizeResume: vi.fn() };
  }),
}));

// ── Test Data ────────────────────────────────────────────────

const mockSnapshot: ResumeSnapshot = {
  profile: {
    name: "John Doe",
    title: "Software Engineer",
    email: "john@example.com",
  },
  summary: "Experienced software engineer with 5 years of experience.",
  experiences: [
    {
      id: "exp-1",
      company: "Tech Corp",
      title: "Software Engineer",
      startDate: "2020-01-01",
      endDate: null,
      isCurrent: true,
      accomplishments: [
        "Built scalable microservices",
        "Improved performance by 50%",
      ],
    },
  ],
  skills: [
    { id: "skill-1", name: "TypeScript", category: "Languages", proficiency: "Expert" },
    { id: "skill-2", name: "React", category: "Frontend", proficiency: "Advanced" },
  ],
};

const mockOptimizationResult = {
  success: true,
  data: {
    optimizedResume: {
      ...mockSnapshot,
      summary: "Results-driven software engineer with 5+ years of experience building scalable systems.",
    },
    changes: [
      {
        section: "summary",
        field: "summary",
        originalValue: mockSnapshot.summary!,
        optimizedValue: "Results-driven software engineer with 5+ years of experience building scalable systems.",
        reason: "keyword_alignment" as const,
      },
    ],
    warnings: [],
    metadata: {
      promptVersion: "ats-v1",
      providerId: "mock",
      model: "test-model",
      fallbackUsed: false,
      attempts: 1,
    },
  },
};

// ── Mocks ────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
const mockOptimizeResume = vi.fn();
const mockGetConfig = vi.fn();

vi.mock("@/lib/supabase/session", function () {
  return {
    requireAuthenticatedUser: function (...args: unknown[]) {
      return mockRequireAuth(...args);
    },
  };
});

vi.mock("@/types/auth", function () {
  class AuthenticationRequiredError extends Error {
    constructor(message?: string) {
      super(message || "Authentication required");
      this.name = "AuthenticationRequiredError";
    }
  }
  return { AuthenticationRequiredError };
});

vi.mock("@/lib/ai/optimization/service", function () {
  return {
    optimizeResume: function (...args: unknown[]) {
      return mockOptimizeResume(...args);
    },
  };
});

vi.mock("@/lib/ai/optimization/provider-manager", function () {
  return {
    ProviderManager: vi.fn().mockImplementation(function () {
      return {};
    }),
  };
});

vi.mock("@/lib/ai/optimization/config", function () {
  return {
    getOptimizationConfig: function (...args: unknown[]) {
      return mockGetConfig(...args);
    },
  };
});

// Import after mocks
import {
  optimizeResumeAction,
  checkOptimizationAvailability,
} from "../optimize-resume-action";

// ── Tests ────────────────────────────────────────────────────

describe("optimizeResumeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockGetConfig.mockReturnValue({
      primary: { id: "mock", apiKey: "test-key", model: "test", timeoutMs: 30000 },
      retryPolicy: { maxPrimaryAttempts: 1, baseDelayMs: 1000, maxDelayMs: 5000, maxTotalDurationMs: 10000 },
      promptVersion: "ats-v1",
    });
  });

  it("returns success with optimized resume", async () => {
    mockOptimizeResume.mockResolvedValue(mockOptimizationResult);

    const result = await optimizeResumeAction({
      resume: mockSnapshot,
      targetJobTitle: "Senior Engineer",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes).toHaveLength(1);
      expect(result.data.optimizedResume.summary).toContain("Results-driven");
    }
  });

  it("returns error when resume is empty", async () => {
    const result = await optimizeResumeAction({
      resume: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("invalid_request");
    }
  });

  it("returns error when optimization fails", async () => {
    mockOptimizeResume.mockResolvedValue({
      success: false,
      error: { code: "rate_limited", message: "Rate limited" },
    });

    const result = await optimizeResumeAction({
      resume: mockSnapshot,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("rate_limited");
      expect(result.error).toContain("busy");
    }
  });

  it("returns error for authentication failure", async () => {
    const { AuthenticationRequiredError } = await import("@/types/auth");
    mockRequireAuth.mockRejectedValue(new AuthenticationRequiredError());

    const result = await optimizeResumeAction({
      resume: mockSnapshot,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("authentication_required");
    }
  });

  it("returns error for configuration error", async () => {
    mockGetConfig.mockImplementation(function () {
      throw new Error("Missing API key");
    });

    const result = await optimizeResumeAction({
      resume: mockSnapshot,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("configuration_error");
    }
  });

  it("validates job title length", async () => {
    const result = await optimizeResumeAction({
      resume: mockSnapshot,
      targetJobTitle: "a".repeat(201),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("invalid_request");
    }
  });

  it("validates job description length", async () => {
    const result = await optimizeResumeAction({
      resume: mockSnapshot,
      targetJobDescription: "a".repeat(10001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("invalid_request");
    }
  });
});

describe("checkOptimizationAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available when configured", async () => {
    mockRequireAuth.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockGetConfig.mockReturnValue({
      primary: { id: "mock", apiKey: "test-key", model: "test", timeoutMs: 30000 },
    });

    const result = await checkOptimizationAvailability();

    expect(result.available).toBe(true);
  });

  it("returns unavailable when not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Not authenticated"));

    const result = await checkOptimizationAvailability();

    expect(result.available).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("returns unavailable when config fails", async () => {
    mockRequireAuth.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockGetConfig.mockImplementation(function () {
      throw new Error("Missing API key");
    });

    const result = await checkOptimizationAvailability();

    expect(result.available).toBe(false);
    expect(result.reason).toBe("configuration_error");
  });

  it("returns unavailable when no API key", async () => {
    mockRequireAuth.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockGetConfig.mockReturnValue({
      primary: { id: "mock", apiKey: "", model: "test", timeoutMs: 30000 },
    });

    const result = await checkOptimizationAvailability();

    expect(result.available).toBe(false);
    expect(result.reason).toBe("not_configured");
  });
});
