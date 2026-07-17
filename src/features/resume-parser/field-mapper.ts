// ─────────────────────────────────────────────────────────────
// Field Mapper
// ─────────────────────────────────────────────────────────────
// Maps classified resume sections to a structured ParsedResume.
// Extracts email, phone, URLs, and section-specific content.
// Never invents information — missing values remain empty.
// ─────────────────────────────────────────────────────────────

import type { ParsedResume } from "./types";
import type { ClassifiedSection } from "./section-classifier";

// ── Regex patterns ───────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const URL_REGEX = /https?:\/\/[^\s]+/;
const GITHUB_REGEX = /github\.com\/[a-zA-Z0-9_-]+/;
const LINKEDIN_REGEX = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/;

// ── Date patterns ────────────────────────────────────────────

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

const DATE_PATTERN = new RegExp(
  `(?:${MONTH_NAMES.join("|")})\\s+\\d{4}|\\d{1,2}/\\d{4}|\\d{4}`,
  "gi",
);

// ── Main mapper ──────────────────────────────────────────────

/**
 * Map classified sections to a ParsedResume structure.
 */
export function mapFieldsToSnapshot(
  sections: ClassifiedSection[],
  rawText: string,
): ParsedResume {
  const result: ParsedResume = {
    warnings: [],
  };

  // Extract header info (first section is usually contact info)
  const headerSection = sections.find((s) => s.type === "header");
  if (headerSection) {
    result.profile = extractProfile(headerSection.content, rawText);
  } else {
    // Try to extract profile from the raw text directly
    result.profile = extractProfile("", rawText);
  }

  // Extract summary
  const summarySection = sections.find((s) => s.type === "summary");
  if (summarySection) {
    result.summary = cleanText(summarySection.content);
  }

  // Extract experience
  const experienceSection = sections.find((s) => s.type === "experience");
  if (experienceSection) {
    result.experiences = extractExperiences(experienceSection.content);
  }

  // Extract education
  const educationSection = sections.find((s) => s.type === "education");
  if (educationSection) {
    result.education = extractEducation(educationSection.content);
  }

  // Extract projects
  const projectsSection = sections.find((s) => s.type === "projects");
  if (projectsSection) {
    result.projects = extractProjects(projectsSection.content);
  }

  // Extract certifications
  const certsSection = sections.find((s) => s.type === "certifications");
  if (certsSection) {
    result.certificates = extractCertificates(certsSection.content);
  }

  // Extract skills
  const skillsSection = sections.find((s) => s.type === "skills");
  if (skillsSection) {
    result.skills = extractSkills(skillsSection.content);
  }

  // Extract languages
  const languagesSection = sections.find((s) => s.type === "languages");
  if (languagesSection) {
    result.languages = extractLanguages(languagesSection.content);
  }

  // Clean up empty warnings
  if (result.warnings && result.warnings.length === 0) {
    delete result.warnings;
  }

  return result;
}

// ── Profile extraction ───────────────────────────────────────

function extractProfile(
  headerContent: string,
  rawText: string,
): ParsedResume["profile"] {
  // Combine header content with first few lines of raw text for better extraction
  const text = headerContent || rawText.split("\n").slice(0, 10).join("\n");

  const profile: NonNullable<ParsedResume["profile"]> = {};

  // Extract name (first non-empty line that doesn't look like a contact detail)
  const lines = text.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !EMAIL_REGEX.test(trimmed) &&
      !PHONE_REGEX.test(trimmed) &&
      !URL_REGEX.test(trimmed) &&
      trimmed.length > 1 &&
      trimmed.length < 60 &&
      !/^\d+$/.test(trimmed)
    ) {
      profile.name = trimmed;
      break;
    }
  }

  // Extract email
  const emailMatch = text.match(EMAIL_REGEX);
  if (emailMatch) {
    profile.email = emailMatch[0].toLowerCase();
  }

  // Extract phone
  const phoneMatch = text.match(PHONE_REGEX);
  if (phoneMatch) {
    profile.phone = phoneMatch[0].trim();
  }

  // Extract GitHub URL
  const githubMatch = text.match(GITHUB_REGEX);
  if (githubMatch) {
    profile.githubUrl = `https://${githubMatch[0]}`;
  }

  // Extract LinkedIn URL
  const linkedinMatch = text.match(LINKEDIN_REGEX);
  if (linkedinMatch) {
    profile.linkedinUrl = `https://${linkedinMatch[0]}`;
  }

  // Extract other URLs (portfolio, etc.)
  const urlMatches = text.match(URL_REGEX);
  if (urlMatches) {
    for (const url of urlMatches) {
      if (
        !url.includes("github.com") &&
        !url.includes("linkedin.com") &&
        !profile.portfolioUrl
      ) {
        profile.portfolioUrl = url;
      }
    }
  }

  // Only return if we found something
  if (Object.keys(profile).length === 0) {
    return undefined;
  }

  return profile;
}

// ── Experience extraction ────────────────────────────────────

function extractExperiences(
  content: string,
): ParsedResume["experiences"] {
  const entries: NonNullable<ParsedResume["experiences"]> = [];

  // Split by common job entry patterns
  // Look for lines with dates or company/title patterns
  const blocks = splitIntoEntries(content);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const entry: (NonNullable<ParsedResume["experiences"]>)[number] = {
      company: "",
      title: "",
      startDate: "",
    };

    // First line is usually "Title at Company" or "Company — Title"
    const firstLine = lines[0].trim();

    // Try to extract dates from the block
    const dates = extractDates(block);
    if (dates.length >= 1) {
      entry.startDate = dates[0];
    }
    if (dates.length >= 2) {
      entry.endDate = dates[1];
    }
    if (/\bcurrent|present|now\b/i.test(block)) {
      entry.isCurrent = true;
      entry.endDate = undefined;
    }

    // Try to split "Title at Company" or "Company - Title"
    const atMatch = firstLine.match(/^(.+?)\s+(?:at|@|–|-|—)\s+(.+)$/);
    if (atMatch) {
      entry.title = cleanText(atMatch[1]);
      entry.company = cleanText(atMatch[2]);
    } else if (lines.length > 1) {
      // First line is title, second might be company
      entry.title = cleanText(firstLine);
      entry.company = cleanText(lines[1]);
    } else {
      // Just use the first line as title
      entry.title = cleanText(firstLine);
    }

    // Extract remaining lines as description/accomplishments
    const descriptionLines = lines.slice(
      lines.length > 1 && atMatch ? 1 : lines.length > 2 ? 2 : 1,
    );
    const bullets = descriptionLines.filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*"));

    if (bullets.length > 0) {
      entry.accomplishments = bullets.map((b) =>
        cleanText(b.replace(/^[•\-*]\s*/, "")),
      );
      entry.description = undefined;
    } else if (descriptionLines.length > 0) {
      entry.description = cleanText(descriptionLines.join("\n"));
    }

    // Only add if we have meaningful data
    if (entry.company || entry.title) {
      entries.push(entry);
    }
  }

  return entries.length > 0 ? entries : undefined;
}

// ── Education extraction ─────────────────────────────────────

function extractEducation(
  content: string,
): ParsedResume["education"] {
  const entries: NonNullable<ParsedResume["education"]> = [];
  const blocks = splitIntoEntries(content);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const entry: (NonNullable<ParsedResume["education"]>)[number] = {
      university: "",
      degree: "",
      startDate: "",
    };

    const firstLine = lines[0].trim();

    // Try to extract dates
    const dates = extractDates(block);
    if (dates.length >= 1) entry.startDate = dates[0];
    if (dates.length >= 2) entry.endDate = dates[1];

    // Common patterns: "Degree at University" or "University — Degree"
    const atMatch = firstLine.match(/^(.+?)\s+(?:at|@|–|-|—)\s+(.+)$/);
    if (atMatch) {
      entry.degree = cleanText(atMatch[1]);
      entry.university = cleanText(atMatch[2]);
    } else if (lines.length > 1) {
      entry.degree = cleanText(firstLine);
      entry.university = cleanText(lines[1]);
    } else {
      // Try to detect if it's a university name or degree
      if (/university|college|institute|school/i.test(firstLine)) {
        entry.university = cleanText(firstLine);
      } else {
        entry.degree = cleanText(firstLine);
      }
    }

    // Look for field of study in remaining lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        /major|field|specialization|concentration/i.test(line) &&
        !entry.fieldOfStudy
      ) {
        entry.fieldOfStudy = cleanText(
          line.replace(/^(?:major|field|specialization|concentration)[:\s]*/i, ""),
        );
      }
    }

    if (entry.university || entry.degree) {
      entries.push(entry);
    }
  }

  return entries.length > 0 ? entries : undefined;
}

// ── Projects extraction ──────────────────────────────────────

function extractProjects(
  content: string,
): ParsedResume["projects"] {
  const entries: NonNullable<ParsedResume["projects"]> = [];
  const blocks = splitIntoEntries(content);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const entry: (NonNullable<ParsedResume["projects"]>)[number] = {
      title: "",
    };

    const firstLine = lines[0].trim();
    entry.title = cleanText(firstLine);

    // Extract description from remaining lines
    if (lines.length > 1) {
      entry.description = cleanText(lines.slice(1).join("\n"));
    }

    // Extract technologies if mentioned
    const techMatch = block.match(
      /(?:technologies?|tech\s+stack|built\s+(?:with|using))[:\s]*(.+)/i,
    );
    if (techMatch) {
      entry.technologies = techMatch[1]
        .split(/[,;|]/)
        .map((t) => cleanText(t))
        .filter(Boolean);
    }

    // Extract URLs
    const urlMatch = block.match(URL_REGEX);
    if (urlMatch) {
      entry.url = urlMatch[0];
    }

    if (entry.title) {
      entries.push(entry);
    }
  }

  return entries.length > 0 ? entries : undefined;
}

// ── Certificates extraction ──────────────────────────────────

function extractCertificates(
  content: string,
): ParsedResume["certificates"] {
  const entries: NonNullable<ParsedResume["certificates"]> = [];
  const blocks = splitIntoEntries(content);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const entry: (NonNullable<ParsedResume["certificates"]>)[number] = {
      name: "",
      startDate: "",
    };

    entry.name = cleanText(lines[0]);

    // Extract dates
    const dates = extractDates(block);
    if (dates.length >= 1) entry.startDate = dates[0];
    if (dates.length >= 2) entry.endDate = dates[1];

    // Extract issuer if present
    if (lines.length > 1) {
      entry.issuingOrganisation = cleanText(lines[1]);
    }

    if (entry.name) {
      entries.push(entry);
    }
  }

  return entries.length > 0 ? entries : undefined;
}

// ── Skills extraction ────────────────────────────────────────

function extractSkills(
  content: string,
): ParsedResume["skills"] {
  const skills: NonNullable<ParsedResume["skills"]> = [];

  // Split by common delimiters
  const items = content
    .split(/[,;|\n•\-*]/)
    .map((s) => cleanText(s))
    .filter((s) => s.length > 0 && s.length < 50);

  for (const item of items) {
    skills.push({
      name: item,
      category: "Technical",
      proficiency: "Proficient",
    });
  }

  return skills.length > 0 ? skills : undefined;
}

// ── Languages extraction ─────────────────────────────────────

function extractLanguages(
  content: string,
): ParsedResume["languages"] {
  const languages: NonNullable<ParsedResume["languages"]> = [];

  // Split by newlines first, then handle each line
  const lines = content.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100) continue;

    // Try to extract proficiency level
    const profMatch = trimmed.match(
      /^(.+?)\s*[-–—]?\s*[(\[{]?(?:native|fluent|advanced|intermediate|basic|beginner|elementary|proficient|conversational)[^)\]}]*[)\]}]?$/i,
    );

    if (profMatch) {
      languages.push({
        name: cleanText(profMatch[1]),
        proficiency: extractProficiencyLevel(trimmed),
      });
    } else {
      // Check if line contains a hyphen separator (e.g., "English - Native")
      const dashMatch = trimmed.match(/^(.+?)\s*[-–—]\s+(.+)$/);
      if (dashMatch) {
        languages.push({
          name: cleanText(dashMatch[1]),
          proficiency: extractProficiencyLevel(dashMatch[2]),
        });
      } else {
        languages.push({
          name: trimmed,
        });
      }
    }
  }

  return languages.length > 0 ? languages : undefined;
}

// ── Utility functions ────────────────────────────────────────

/**
 * Split content into individual entries based on common patterns.
 * Looks for blank lines as primary separators.
 * For entries without blank lines, treats the entire content as one entry.
 */
function splitIntoEntries(content: string): string[] {
  // Split on blank lines (most reliable)
  const blocks = content.split(/\n\s*\n/).filter((b) => b.trim());

  return blocks.length > 0 ? blocks : [content];
}

/**
 * Extract dates from text content.
 * Returns an array of date strings.
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  const matches = text.match(DATE_PATTERN);

  if (matches) {
    for (const match of matches) {
      const normalized = normalizeDate(match);
      if (normalized && !dates.includes(normalized)) {
        dates.push(normalized);
      }
    }
  }

  return dates;
}

/**
 * Normalize a date string to YYYY-MM format.
 */
function normalizeDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();

  // Already in YYYY format
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  // MM/YYYY format
  const mmYyyy = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = mmYyyy[1].padStart(2, "0");
    return `${mmYyyy[2]}-${month}`;
  }

  // Month YYYY format
  for (const month of MONTH_NAMES) {
    if (trimmed.toLowerCase().startsWith(month)) {
      const year = trimmed.match(/\d{4}/);
      if (year) {
        const monthIndex = MONTH_NAMES.indexOf(month) % 12;
        const monthNum = String(monthIndex + 1).padStart(2, "0");
        return `${year[0]}-${monthNum}`;
      }
    }
  }

  return null;
}

/**
 * Extract proficiency level from a language string.
 */
function extractProficiencyLevel(text: string): string {
  const lower = text.toLowerCase();

  if (/native/i.test(lower)) return "Native";
  if (/fluent/i.test(lower)) return "Fluent";
  if (/advanced/i.test(lower)) return "Advanced";
  if (/intermediate/i.test(lower)) return "Intermediate";
  if (/basic|beginner|elementary/i.test(lower)) return "Basic";
  if (/conversational/i.test(lower)) return "Conversational";
  if (/proficient/i.test(lower)) return "Proficient";

  return "Proficient";
}

/**
 * Clean text content by normalizing whitespace and removing artifacts.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
