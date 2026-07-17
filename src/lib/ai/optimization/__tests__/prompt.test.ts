import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  PROMPT_VERSION,
  RESPONSE_JSON_SCHEMA,
} from "../../prompts/ats-v1";
import type { OptimizeResumeRequest } from "../types";
import type { ResumeSnapshot } from "@/types/resume";

const MOCK_SNAPSHOT: ResumeSnapshot = {
  profile: { name: "Test User" },
  summary: "Engineer",
  experiences: [
    {
      company: "TechCorp",
      title: "Engineer",
      startDate: "2020-01",
    },
  ],
};

describe("ATS Prompt ats-v1", () => {
  describe("system prompt", () => {
    it("includes ATS keyword alignment objective", () => {
      expect(SYSTEM_PROMPT).toContain("ATS");
      expect(SYSTEM_PROMPT).toContain("keyword alignment");
    });

    it("includes factual preservation rules", () => {
      expect(SYSTEM_PROMPT).toContain("SOLE source of truth");
      expect(SYSTEM_PROMPT).toContain("NEVER invent");
    });

    it("includes prohibition on invented metrics", () => {
      expect(SYSTEM_PROMPT).toContain("NEVER add fake metrics");
      expect(SYSTEM_PROMPT).toContain("NEVER convert vague statements");
    });

    it("includes instruction to preserve dates and identities", () => {
      expect(SYSTEM_PROMPT).toContain("Employer/company names");
      expect(SYSTEM_PROMPT).toContain("Job titles");
      expect(SYSTEM_PROMPT).toContain("Employment dates");
    });

    it("includes instruction to avoid keyword stuffing", () => {
      expect(SYSTEM_PROMPT).toContain("keyword stuffing");
    });

    it("includes structured output instruction", () => {
      expect(SYSTEM_PROMPT).toContain("valid JSON");
    });

    it("does not include secrets", () => {
      expect(SYSTEM_PROMPT).not.toContain("API_KEY");
      expect(SYSTEM_PROMPT).not.toContain("Bearer");
      expect(SYSTEM_PROMPT).not.toContain("gsk_");
    });
  });

  describe("user prompt builder", () => {
    it("includes source resume as JSON", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).toContain("SOURCE RESUME");
      expect(prompt).toContain("Test User");
    });

    it("includes job title when provided", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        targetJobTitle: "Staff Engineer",
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).toContain("Staff Engineer");
    });

    it("includes job description when provided", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        targetJobDescription: "Looking for React experience",
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).toContain("Looking for React experience");
    });

    it("excludes undefined optional fields cleanly", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).not.toContain("TARGET JOB TITLE");
      expect(prompt).not.toContain("TARGET JOB DESCRIPTION");
      expect(prompt).not.toContain("TARGET INDUSTRY");
      expect(prompt).not.toContain("EXPERIENCE LEVEL");
    });

    it("includes industry when provided", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        targetIndustry: "Technology",
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).toContain("Technology");
    });

    it("includes experience level when provided", () => {
      const request: OptimizeResumeRequest = {
        resume: MOCK_SNAPSHOT,
        experienceLevel: "Senior",
        optimizationMode: "ats",
        promptVersion: "ats-v1",
      };

      const prompt = buildUserPrompt(request);
      expect(prompt).toContain("Senior");
    });
  });

  describe("prompt version", () => {
    it("uses ats-v1 identifier", () => {
      expect(PROMPT_VERSION).toBe("ats-v1");
    });
  });

  describe("response JSON schema", () => {
    it("has required fields", () => {
      expect(RESPONSE_JSON_SCHEMA.schema.properties.optimizedResume).toBeDefined();
      expect(RESPONSE_JSON_SCHEMA.schema.properties.changes).toBeDefined();
      expect(RESPONSE_JSON_SCHEMA.schema.properties.warnings).toBeDefined();
      expect(RESPONSE_JSON_SCHEMA.schema.required).toContain("optimizedResume");
      expect(RESPONSE_JSON_SCHEMA.schema.required).toContain("changes");
      expect(RESPONSE_JSON_SCHEMA.schema.required).toContain("warnings");
    });

    it("has strict mode enabled", () => {
      expect(RESPONSE_JSON_SCHEMA.strict).toBe(true);
    });

    it("has schema name", () => {
      expect(RESPONSE_JSON_SCHEMA.name).toBe("optimized_resume");
    });
  });
});
