import { describe, it, expect, vi } from "vitest";
import { MockResumeOptimizationProvider } from "../mock-provider";
import type { OptimizeResumeRequest } from "../types";
import type { ResumeSnapshot } from "@/types/resume";

const MOCK_SNAPSHOT: ResumeSnapshot = {
  profile: { name: "Test User", title: "Engineer" },
  summary: "A very good software engineer.",
  experiences: [
    {
      company: "TechCorp",
      title: "Engineer",
      startDate: "2020-01",
      endDate: null,
      isCurrent: true,
      accomplishments: ["was responsible for building things"],
      skills: ["TypeScript", "React"],
    },
  ],
  skills: [
    { name: "React", category: "Frameworks", proficiency: "Advanced" },
    { name: "TypeScript", category: "Languages", proficiency: "Expert" },
  ],
};

const MOCK_REQUEST: OptimizeResumeRequest = {
  resume: MOCK_SNAPSHOT,
  optimizationMode: "ats",
  promptVersion: "ats-v1",
};

describe("MockResumeOptimizationProvider", () => {
  const provider = new MockResumeOptimizationProvider();

  it("returns success with optimized resume", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.success).toBe(true);
    expect(result.optimizedResume).toBeDefined();
    expect(result.optimizedResume.profile?.name).toBe("Test User");
  });

  it("makes no network calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await provider.optimizeResume(MOCK_REQUEST);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("removes filler words from summary", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.optimizedResume.summary).not.toContain("very");
  });

  it("replaces weak bullet starters", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    const bullet =
      result.optimizedResume.experiences?.[0]?.accomplishments?.[0] ?? "";
    expect(bullet).not.toContain("was responsible for");
  });

  it("reorders skills alphabetically", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    const skillNames = result.optimizedResume.skills?.map((s) => s.name);
    expect(skillNames).toEqual(["React", "TypeScript"]);
  });

  it("does not add new skills", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    const skillNames = result.optimizedResume.skills?.map((s) =>
      s.name.toLowerCase(),
    );
    expect(skillNames).toContain("typescript");
    expect(skillNames).toContain("react");
    expect(skillNames).not.toContain("python");
    expect(skillNames).not.toContain("java");
  });

  it("preserves employer names", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.optimizedResume.experiences?.[0].company).toBe("TechCorp");
  });

  it("preserves job titles", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.optimizedResume.experiences?.[0].title).toBe("Engineer");
  });

  it("preserves dates", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.optimizedResume.experiences?.[0].startDate).toBe("2020-01");
    expect(result.optimizedResume.experiences?.[0].endDate).toBeNull();
  });

  it("returns changes metadata", async () => {
    const result = await provider.optimizeResume(MOCK_REQUEST);

    expect(result.changes).toBeInstanceOf(Array);
  });

  it("returns warnings when no optimizations applied", async () => {
    const request: OptimizeResumeRequest = {
      resume: {
        profile: { name: "Clean" },
        summary: "Professional summary.",
        skills: [{ name: "A", category: "", proficiency: "" }],
      },
      optimizationMode: "ats",
      promptVersion: "ats-v1",
    };

    const result = await provider.optimizeResume(request);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
