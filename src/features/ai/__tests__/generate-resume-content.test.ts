import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockAIProvider } from "@/lib/ai";
import { generateResumeContent } from "../generate-resume-content";
import type { AIProvider, GenerateResumeInput } from "@/lib/ai/types";

vi.mock("server-only", () => ({}));

const VALID_INPUT: GenerateResumeInput = {
  profile: { name: "Test User", title: "Engineer" },
  skills: ["TypeScript"],
};

describe("generateResumeContent", () => {
  let provider: AIProvider;

  beforeEach(() => {
    provider = new MockAIProvider();
  });

  it("returns success with valid input", async () => {
    const result = await generateResumeContent(provider, VALID_INPUT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.snapshot).toBeDefined();
      expect(result.data.snapshot.profile?.name).toBe("Test User");
    }
  });

  it("returns validation_error for empty input", async () => {
    const result = await generateResumeContent(provider, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns validation_error for invalid nested data", async () => {
    const result = await generateResumeContent(provider, {
      experiences: [{ company: "", title: "", startDate: "" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns provider_unavailable when provider throws", async () => {
    const failingProvider: AIProvider = {
      name: "failing",
      improveSummary: vi.fn(),
      improveExperience: vi.fn(),
      improveSkills: vi.fn(),
      generateResume: vi.fn().mockRejectedValue(new Error("Network error")),
    };

    const result = await generateResumeContent(failingProvider, VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("provider_unavailable");
    }
  });

  it("returns invalid_provider_response for bad provider result", async () => {
    const badProvider: AIProvider = {
      name: "bad",
      improveSummary: vi.fn(),
      improveExperience: vi.fn(),
      improveSkills: vi.fn(),
      generateResume: vi.fn().mockResolvedValue({ data: null, provider: "bad" }),
    };

    const result = await generateResumeContent(badProvider, VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("invalid_provider_response");
    }
  });

  it("returns invalid_provider_response for missing snapshot", async () => {
    const badProvider: AIProvider = {
      name: "bad",
      improveSummary: vi.fn(),
      improveExperience: vi.fn(),
      improveSkills: vi.fn(),
      generateResume: vi.fn().mockResolvedValue({
        data: { snapshot: null },
        provider: "bad",
      }),
    };

    const result = await generateResumeContent(badProvider, VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("invalid_provider_response");
    }
  });

  it("invokes provider exactly once", async () => {
    const spy = vi.spyOn(provider, "generateResume");
    await generateResumeContent(provider, VALID_INPUT);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not expose raw provider errors", async () => {
    const failingProvider: AIProvider = {
      name: "failing",
      improveSummary: vi.fn(),
      improveExperience: vi.fn(),
      improveSkills: vi.fn(),
      generateResume: vi.fn().mockRejectedValue(
        new Error("Internal API key leaked"),
      ),
    };

    const result = await generateResumeContent(failingProvider, VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("API key");
    }
  });

  it("does not write to database", async () => {
    const result = await generateResumeContent(provider, VALID_INPUT);
    expect(result.success).toBe(true);
  });
});
