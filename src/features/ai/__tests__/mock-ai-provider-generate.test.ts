import { describe, it, expect, vi } from "vitest";
import { MockAIProvider } from "@/lib/ai";
import type { GenerateResumeInput } from "@/lib/ai/types";

const provider = new MockAIProvider();

const FULL_INPUT: GenerateResumeInput = {
  profile: {
    name: "Jane Smith",
    title: "Senior Software Engineer",
    bio: "Passionate engineer with 8 years of experience.",
    email: "jane@example.com",
    phone: "+1-555-0100",
    city: "San Francisco",
    country: "US",
    githubUrl: "https://github.com/janesmith",
    linkedinUrl: "https://linkedin.com/in/janesmith",
  },
  experiences: [
    {
      company: "TechCorp",
      title: "Senior Engineer",
      startDate: "2020-01",
      endDate: null,
      isCurrent: true,
      accomplishments: ["Built microservices", "Led team of 5"],
      skills: ["TypeScript", "React"],
    },
    {
      company: "StartupInc",
      title: "Developer",
      startDate: "2017-06",
      endDate: "2019-12",
      isCurrent: false,
      accomplishments: ["Developed MVP"],
      skills: ["JavaScript", "Node.js"],
    },
  ],
  education: [
    {
      university: "MIT",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: "2013-09",
      endDate: "2017-05",
    },
  ],
  projects: [
    {
      title: "OpenSource Tool",
      description: "A helpful tool",
      technologies: ["TypeScript", "PostgreSQL"],
      url: "https://example.com",
    },
  ],
  certificates: [
    {
      name: "AWS Solutions Architect",
      issuingOrganisation: "Amazon",
      startDate: "2022-01",
      endDate: "2025-01",
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  targetRole: "Staff Engineer",
};

describe("MockAIProvider.generateResume", () => {
  it("returns valid ResumeSnapshot shape", async () => {
    const result = await provider.generateResume(FULL_INPUT);

    expect(result.provider).toBe("mock");
    expect(result.data.snapshot).toBeDefined();
    expect(result.data.snapshot.profile).toBeDefined();
    expect(result.data.snapshot.summary).toBeDefined();
  });

  it("preserves profile facts", async () => {
    const result = await provider.generateResume(FULL_INPUT);
    const snapshot = result.data.snapshot;

    expect(snapshot.profile?.name).toBe("Jane Smith");
    expect(snapshot.profile?.title).toBe("Senior Software Engineer");
    expect(snapshot.profile?.email).toBe("jane@example.com");
  });

  it("preserves experience facts", async () => {
    const result = await provider.generateResume(FULL_INPUT);
    const experiences = result.data.snapshot.experiences;

    expect(experiences).toHaveLength(2);
    expect(experiences?.[0].company).toBe("TechCorp");
    expect(experiences?.[0].title).toBe("Senior Engineer");
    expect(experiences?.[0].accomplishments).toEqual(["Built microservices", "Led team of 5"]);
    expect(experiences?.[0].skills).toEqual(["TypeScript", "React"]);
  });

  it("preserves education facts", async () => {
    const result = await provider.generateResume(FULL_INPUT);
    const education = result.data.snapshot.education;

    expect(education).toHaveLength(1);
    expect(education?.[0].university).toBe("MIT");
    expect(education?.[0].degree).toBe("BS");
    expect(education?.[0].fieldOfStudy).toBe("Computer Science");
  });

  it("preserves project facts", async () => {
    const result = await provider.generateResume(FULL_INPUT);
    const projects = result.data.snapshot.projects;

    expect(projects).toHaveLength(1);
    expect(projects?.[0].title).toBe("OpenSource Tool");
    expect(projects?.[0].technologies).toEqual(["TypeScript", "PostgreSQL"]);
  });

  it("preserves certificate facts", async () => {
    const result = await provider.generateResume(FULL_INPUT);
    const certificates = result.data.snapshot.certificates;

    expect(certificates).toHaveLength(1);
    expect(certificates?.[0].name).toBe("AWS Solutions Architect");
    expect(certificates?.[0].issuingOrganisation).toBe("Amazon");
  });

  it("deduplicates and sorts skills", async () => {
    const result = await provider.generateResume({
      skills: ["React", "TypeScript", "React"],
    });
    const skills = result.data.snapshot.skills;

    expect(skills).toEqual([
      { name: "React", category: "", proficiency: "" },
      { name: "TypeScript", category: "", proficiency: "" },
    ]);
  });

  it("generates summary from profile bio", async () => {
    const result = await provider.generateResume({
      profile: { bio: "Experienced engineer." },
    });
    expect(result.data.snapshot.summary).toBe("Experienced engineer.");
  });

  it("generates template summary when no bio", async () => {
    const result = await provider.generateResume({
      profile: { title: "Designer" },
    });
    expect(result.data.snapshot.summary).toContain("Designer");
  });

  it("generates template summary with target role", async () => {
    const result = await provider.generateResume({
      targetRole: "DevOps Engineer",
    });
    expect(result.data.snapshot.summary).toContain("DevOps Engineer");
  });

  it("handles empty optional sections", async () => {
    const result = await provider.generateResume({
      profile: { name: "Test User" },
    });

    expect(result.data.snapshot.experiences).toBeUndefined();
    expect(result.data.snapshot.education).toBeUndefined();
    expect(result.data.snapshot.projects).toBeUndefined();
    expect(result.data.snapshot.certificates).toBeUndefined();
    expect(result.data.snapshot.skills).toBeUndefined();
  });

  it("is deterministic for same input", async () => {
    const result1 = await provider.generateResume(FULL_INPUT);
    const result2 = await provider.generateResume(FULL_INPUT);

    expect(result1.data.snapshot).toEqual(result2.data.snapshot);
  });

  it("makes no network calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await provider.generateResume(FULL_INPUT);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
