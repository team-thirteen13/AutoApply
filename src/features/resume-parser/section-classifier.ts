// ─────────────────────────────────────────────────────────────
// Section Classifier
// ─────────────────────────────────────────────────────────────
// Classifies raw resume text into named sections using common
// header patterns. Handles variations in capitalization and
// common synonyms for each section type.
// ─────────────────────────────────────────────────────────────

/** A classified section with its type and content. */
export interface ClassifiedSection {
  type: SectionType;
  content: string;
}

export type SectionType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "skills"
  | "languages"
  | "other";

/** Maps normalized header text to section types. */
const SECTION_PATTERNS: Array<{ pattern: RegExp; type: SectionType }> = [
  // Summary / Objective
  { pattern: /^(?:professional\s+)?summary$/i, type: "summary" },
  { pattern: /^(?:career\s+)?objective$/i, type: "summary" },
  { pattern: /^about\s+(?:me|myself)$/i, type: "summary" },
  { pattern: /^profile$/i, type: "summary" },
  { pattern: /^personal\s+statement$/i, type: "summary" },
  { pattern: /^overview$/i, type: "summary" },

  // Experience
  { pattern: /^(?:work\s+)?experience$/i, type: "experience" },
  { pattern: /^employment\s+(?:history|record)$/i, type: "experience" },
  { pattern: /^professional\s+experience$/i, type: "experience" },
  { pattern: /^career\s+history$/i, type: "experience" },
  { pattern: /^work\s+history$/i, type: "experience" },

  // Education
  { pattern: /^education$/i, type: "education" },
  { pattern: /^academic\s+(?:background|history)$/i, type: "education" },
  { pattern: /^education\s+(?:background|history)$/i, type: "education" },
  { pattern: /^qualifications$/i, type: "education" },

  // Projects
  { pattern: /^projects?$/i, type: "projects" },
  { pattern: /^portfolio$/i, type: "projects" },
  { pattern: /^key\s+projects?$/i, type: "projects" },
  { pattern: /^notable\s+projects?$/i, type: "projects" },

  // Certifications
  { pattern: /^(?:certifications?|certificates?)$/i, type: "certifications" },
  { pattern: /^licenses?\s+(?:&|and)\s+certifications?$/i, type: "certifications" },
  { pattern: /^professional\s+certifications?$/i, type: "certifications" },

  // Skills
  { pattern: /^(?:technical\s+)?skills?$/i, type: "skills" },
  { pattern: /^core\s+competencies$/i, type: "skills" },
  { pattern: /^key\s+skills?$/i, type: "skills" },
  { pattern: /^technologies$/i, type: "skills" },
  { pattern: /^tech\s+stack$/i, type: "skills" },
  { pattern: /^competencies$/i, type: "skills" },

  // Languages
  { pattern: /^languages?$/i, type: "languages" },
  { pattern: /^language\s+skills?$/i, type: "languages" },
  { pattern: /^languages?\s+(?:spoken|proficiency)$/i, type: "languages" },
];

/**
 * Classify raw resume text into named sections.
 * Uses line-by-line analysis to find section headers.
 */
export function classifySections(rawText: string): ClassifiedSection[] {
  const lines = rawText.split("\n");
  const sections: ClassifiedSection[] = [];
  let currentType: SectionType = "header";
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines but preserve them in content
    if (trimmed === "") {
      currentContent.push("");
      continue;
    }

    // Check if this line is a section header
    const detectedType = detectSectionHeader(trimmed);

    if (detectedType) {
      // Save previous section if it has content
      const content = currentContent.join("\n").trim();
      if (content) {
        sections.push({ type: currentType, content });
      }
      currentType = detectedType;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget the last section
  const lastContent = currentContent.join("\n").trim();
  if (lastContent) {
    sections.push({ type: currentType, content: lastContent });
  }

  return sections;
}

/**
 * Detect if a line is a section header.
 * Returns the section type if detected, null otherwise.
 *
 * Heuristics:
 * - Must be short (≤60 chars)
 * - Should not contain sentence-like patterns
 * - Should match known section header patterns
 */
function detectSectionHeader(line: string): SectionType | null {
  // Skip very long lines — unlikely to be headers
  if (line.length > 60) return null;

  // Skip lines that look like sentences (contain multiple spaces or common words)
  if (/\b(?:the|and|with|for|from|at|in|of|to|a|an)\b.*\b(?:the|and|with|for|from|at|in|of|to|a|an)\b/i.test(line)) {
    return null;
  }

  // Check against known patterns
  for (const { pattern, type } of SECTION_PATTERNS) {
    if (pattern.test(line)) {
      return type;
    }
  }

  return null;
}
