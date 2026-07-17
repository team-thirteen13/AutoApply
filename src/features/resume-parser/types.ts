// ─────────────────────────────────────────────────────────────
// Resume Parser Types
// ─────────────────────────────────────────────────────────────
// Types for the resume document parsing pipeline.
// Handles PDF and DOCX extraction into a normalized ParsedResume
// that maps to ResumeSnapshot.
// ─────────────────────────────────────────────────────────────

import type { ResumeSnapshot } from "@/types/resume";

// ── Parser error codes ───────────────────────────────────────

export type ResumeParserErrorCode =
  | "unsupported_file_type"
  | "scanned_pdf"
  | "malformed_document"
  | "empty_document"
  | "extraction_failed";

export interface ResumeParserError {
  code: ResumeParserErrorCode;
  message: string;
}

// ── Parser result ────────────────────────────────────────────

export type ResumeParserResult =
  | { success: true; data: ParsedResume }
  | { success: false; error: ResumeParserError };

// ── Parsed resume ────────────────────────────────────────────
// Extracted content from a document, ready for normalization.

export interface ParsedResume {
  profile?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    location?: string;
    tagline?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  summary?: string;
  experiences?: Array<{
    company: string;
    title: string;
    employmentType?: string;
    location?: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string;
    accomplishments?: string[];
    skills?: string[];
  }>;
  education?: Array<{
    university: string;
    degree: string;
    fieldOfStudy?: string;
    location?: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
    achievements?: string[];
  }>;
  projects?: Array<{
    title: string;
    role?: string;
    description?: string;
    technologies?: string[];
    url?: string;
    liveUrl?: string;
    gitUrl?: string;
    startDate?: string;
    endDate?: string | null;
  }>;
  certificates?: Array<{
    name: string;
    issuingOrganisation?: string;
    url?: string;
    credentialId?: string;
    startDate: string;
    endDate?: string | null;
    doesNotExpire?: boolean;
  }>;
  skills?: Array<{
    name: string;
    category: string;
    proficiency: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency?: string;
  }>;
  warnings?: string[];
}

// ── Parser interface ─────────────────────────────────────────

export interface ResumeParser {
  parse(buffer: Buffer, mimeType: string): Promise<ResumeParserResult>;
}

// ── Normalized snapshot result ───────────────────────────────

export type NormalizeResult =
  | { success: true; data: ResumeSnapshot; warnings: string[] }
  | { success: false; error: ResumeParserError };
