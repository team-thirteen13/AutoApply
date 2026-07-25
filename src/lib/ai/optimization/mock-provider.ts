// ─────────────────────────────────────────────────────────────
// Mock Resume Optimization Provider
// ─────────────────────────────────────────────────────────────
// Deterministic mock implementation for testing and development.
// Returns the source resume with minimal safe transformations.
// No external API calls — safe to run in any environment.
// ─────────────────────────────────────────────────────────────

import type {
  ResumeOptimizationProvider,
  OptimizeResumeRequest,
  OptimizeResumeProviderResult,
} from "./types";
import type { ResumeSnapshot } from "@/types/resume";

export class MockResumeOptimizationProvider
  implements ResumeOptimizationProvider
{
  readonly id = "mock";

  async optimizeResume(
    request: OptimizeResumeRequest,
  ): Promise<OptimizeResumeProviderResult> {
    const source = request.resume;
    const changes: OptimizeResumeProviderResult["changes"] = [];
    const warnings: string[] = [];

    // Optimize summary if present
    let summary = source.summary;
    if (summary?.trim()) {
      const optimized = optimizeText(summary);
      if (optimized !== summary) {
        changes.push({
          section: "summary",
          field: "summary",
          originalValue: summary,
          optimizedValue: optimized,
          reason: "conciseness",
        });
        summary = optimized;
      }
    }

    // Optimize experience accomplishments
    const experiences = source.experiences?.map((exp) => {
      const accomplishments = exp.accomplishments?.map((bullet) => {
        const optimized = optimizeBullet(bullet);
        if (optimized !== bullet) {
          changes.push({
            section: "experiences",
            field: `${exp.company}/${exp.title}.accomplishments`,
            originalValue: bullet,
            optimizedValue: optimized,
            reason: "action_verbs",
          });
          return optimized;
        }
        return bullet;
      });

      return { ...exp, accomplishments };
    });

    // Reorder skills alphabetically (no new skills added)
    const skills = source.skills
      ? [...source.skills].sort((a, b) => a.name.localeCompare(b.name))
      : undefined;

    if (
      source.skills &&
      skills &&
      JSON.stringify(source.skills) !== JSON.stringify(skills)
    ) {
      changes.push({
        section: "skills",
        field: "skills",
        originalValue: source.skills.map((s) => s.name).join(", "),
        optimizedValue: skills.map((s) => s.name).join(", "),
        reason: "skill_organization",
      });
    }

    const optimizedResume: ResumeSnapshot = {
      ...source,
      summary,
      experiences,
      skills,
    };

    if (changes.length === 0) {
      warnings.push("No optimizations were applied.");
    }

    return {
      success: true,
      optimizedResume,
      changes,
      warnings,
    };
  }
}

// ── Text Helpers ─────────────────────────────────────────────

const FILLER_PATTERNS: [RegExp, string][] = [
  [/\bvery\b/gi, ""],
  [/\breally\b/gi, ""],
  [/\bquite\b/gi, ""],
  [/\bsomewhat\b/gi, ""],
  [/\bbasically\b/gi, ""],
  [/\bactually\b/gi, ""],
  [/\bjust\b/gi, ""],
  [/\bthat\b/gi, ""],
  [/\bresponsible for\b/gi, ""],
];

function optimizeText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of FILLER_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  // Clean up double spaces
  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}

function optimizeBullet(bullet: string): string {
  let result = bullet;

  // Replace weak starters with action verbs
  const weakStarters: [RegExp, string][] = [
    [/^(?:was |were )?(?:responsible for |tasked with )/i, ""],
    [/^(?:helped |assisted )/i, "Supported "],
    [/^(?:did |performed )/i, "Executed "],
    [/^(?:worked on )/i, "Contributed to "],
  ];

  for (const [pattern, replacement] of weakStarters) {
    result = result.replace(pattern, replacement);
  }

  // Clean up double spaces
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
}
