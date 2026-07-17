// ─────────────────────────────────────────────────────────────
// Resume Parser
// ─────────────────────────────────────────────────────────────
// Public API for resume document parsing.
// Handles PDF and DOCX extraction into ResumeSnapshot.
// ─────────────────────────────────────────────────────────────

export { parseResume } from "./parse-resume";
export type {
  ResumeParserResult,
  ResumeParserError,
  ResumeParserErrorCode,
  ParsedResume,
  NormalizeResult,
} from "./types";
