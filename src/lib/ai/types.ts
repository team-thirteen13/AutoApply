// ─────────────────────────────────────────────────────────────
// AI Provider Interface & Types
// ─────────────────────────────────────────────────────────────
// Defines the contract for AI providers. Member 3 implements
// real providers (Groq, Gemini, OpenRouter, OpenAI). Member 1
// provides the interface and MockAIProvider for testing.
//
// All methods are async and return AIResult<T> — a structured
// response that includes the improved data and provider metadata.
// ─────────────────────────────────────────────────────────────

import type { Experience } from "@/types/experience";

// ── AI Result wrapper ───────────────────────────────────────

export interface AIResult<T> {
  /** The improved data from the AI provider. */
  data: T;
  /** Provider name (e.g. "mock", "groq", "openai"). */
  provider: string;
  /** Optional human-readable note about what changed. */
  note?: string;
}

// ── Improve Summary ─────────────────────────────────────────

export interface ImproveSummaryInput {
  /** Current bio/summary text. */
  bio: string;
  /** Target role or industry for context (optional). */
  targetRole?: string;
}

export interface ImproveSummaryOutput {
  /** The improved bio/summary text. */
  bio: string;
}

// ── Improve Experience ──────────────────────────────────────

export interface ImproveExperienceInput {
  /** The experience to improve. */
  experience: Pick<
    Experience,
    "company" | "title" | "accomplishments" | "skills"
  >;
}

export interface ImproveExperienceOutput {
  /** Improved accomplishment bullet points. */
  accomplishments: string[];
  /** Improved skill tags. */
  skills: string[];
}

// ── Improve Skills ──────────────────────────────────────────

export interface ImproveSkillsInput {
  /** Current list of skill names. */
  skills: string[];
  /** Target role or job description for context (optional). */
  targetRole?: string;
}

export interface ImproveSkillsOutput {
  /** Improved/organized skill list. */
  skills: string[];
}

// ── AI Provider Interface ───────────────────────────────────

export interface AIProvider {
  /** Unique provider identifier. */
  readonly name: string;

  /**
   * Improve a bio/summary using AI.
   * Returns an improved version of the text.
   */
  improveSummary(input: ImproveSummaryInput): Promise<AIResult<ImproveSummaryOutput>>;

  /**
   * Improve an experience's accomplishments and skills.
   * Returns improved bullet points and skill tags.
   */
  improveExperience(input: ImproveExperienceInput): Promise<AIResult<ImproveExperienceOutput>>;

  /**
   * Improve and organize a list of skills.
   * Returns a cleaned, deduplicated, and optionally enriched list.
   */
  improveSkills(input: ImproveSkillsInput): Promise<AIResult<ImproveSkillsOutput>>;
}
