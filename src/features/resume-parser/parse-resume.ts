// ─────────────────────────────────────────────────────────────
// Parse Resume
// ─────────────────────────────────────────────────────────────
// Main entry point for resume document parsing.
// Selects the appropriate parser based on MIME type,
// extracts content, normalizes to ResumeSnapshot.
// No AI — pure document parsing.
// ─────────────────────────────────────────────────────────────

import "server-only";

import type {
  ResumeParser,
  NormalizeResult,
} from "./types";
import type { ResumeSnapshot } from "@/types/resume";
import { PdfResumeParser } from "./pdf-parser";
import { DocxResumeParser } from "./docx-parser";

// ── MIME type to parser mapping ──────────────────────────────

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Get parser for a given MIME type.
 * Creates parser instances lazily for testability.
 */
function getParser(mimeType: string): ResumeParser | null {
  switch (mimeType) {
    case PDF_MIME:
      return new PdfResumeParser();
    case DOCX_MIME:
      return new DocxResumeParser();
    default:
      return null;
  }
}

// ── Main parse function ──────────────────────────────────────

/**
 * Parse a resume document (PDF or DOCX) from a buffer.
 *
 * @param buffer - The file content as a Buffer
 * @param mimeType - The MIME type of the file
 * @returns Parsed and normalized ResumeSnapshot
 */
export async function parseResume(
  buffer: Buffer,
  mimeType: string,
): Promise<NormalizeResult> {
  // Validate MIME type
  const parser = getParser(mimeType);
  if (!parser) {
    return {
      success: false,
      error: {
        code: "unsupported_file_type",
        message:
          "Unsupported file type. Please upload a PDF or DOCX file.",
      },
    };
  }

  // Extract content
  const parseResult = await parser.parse(buffer, mimeType);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    };
  }

  // Normalize to ResumeSnapshot
  const normalized = normalizeToSnapshot(parseResult.data);

  return normalized;
}

// ── Normalization ────────────────────────────────────────────

/**
 * Normalize a ParsedResume to a ResumeSnapshot.
 * Validates structure and applies defaults.
 */
function normalizeToSnapshot(
  parsed: import("./types").ParsedResume,
): NormalizeResult {
  const warnings: string[] = [];
  if (parsed.warnings) {
    warnings.push(...parsed.warnings);
  }

  const snapshot: ResumeSnapshot = {};

  // Map profile
  if (parsed.profile && Object.keys(parsed.profile).length > 0) {
    snapshot.profile = {
      name: parsed.profile.name,
      title: parsed.profile.title,
      email: parsed.profile.email,
      phone: parsed.profile.phone,
      city: parsed.profile.city,
      country: parsed.profile.country,
      address: parsed.profile.address,
      location: parsed.profile.location,
      tagline: parsed.profile.tagline,
      bio: parsed.profile.bio,
      githubUrl: parsed.profile.githubUrl,
      linkedinUrl: parsed.profile.linkedinUrl,
      portfolioUrl: parsed.profile.portfolioUrl,
      photoUrl: undefined,
    };
  }

  // Map summary
  if (parsed.summary) {
    snapshot.summary = parsed.summary;
  }

  // Map experiences
  if (parsed.experiences && parsed.experiences.length > 0) {
    snapshot.experiences = parsed.experiences.map((exp) => ({
      id: crypto.randomUUID(),
      company: exp.company,
      title: exp.title,
      employmentType: exp.employmentType,
      location: exp.location,
      startDate: exp.startDate || "",
      endDate: exp.endDate,
      isCurrent: exp.isCurrent,
      description: exp.description,
      accomplishments: exp.accomplishments,
      skills: exp.skills,
    }));
  }

  // Map education
  if (parsed.education && parsed.education.length > 0) {
    snapshot.education = parsed.education.map((edu) => ({
      id: crypto.randomUUID(),
      university: edu.university,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      location: edu.location,
      startDate: edu.startDate || "",
      endDate: edu.endDate,
      isCurrent: edu.isCurrent,
      grade: edu.grade,
      description: edu.description,
      achievements: edu.achievements,
    }));
  }

  // Map projects
  if (parsed.projects && parsed.projects.length > 0) {
    snapshot.projects = parsed.projects.map((proj) => ({
      id: crypto.randomUUID(),
      title: proj.title,
      role: proj.role,
      description: proj.description,
      technologies: proj.technologies,
      url: proj.url,
      liveUrl: proj.liveUrl,
      gitUrl: proj.gitUrl,
      startDate: proj.startDate,
      endDate: proj.endDate,
    }));
  }

  // Map certificates
  if (parsed.certificates && parsed.certificates.length > 0) {
    snapshot.certificates = parsed.certificates.map((cert) => ({
      id: crypto.randomUUID(),
      name: cert.name,
      issuingOrganisation: cert.issuingOrganisation,
      url: cert.url,
      credentialId: cert.credentialId,
      startDate: cert.startDate || "",
      endDate: cert.endDate,
      doesNotExpire: cert.doesNotExpire,
    }));
  }

  // Map skills
  if (parsed.skills && parsed.skills.length > 0) {
    snapshot.skills = parsed.skills.map((skill) => ({
      id: crypto.randomUUID(),
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
    }));
  }

  // Map languages
  if (parsed.languages && parsed.languages.length > 0) {
    snapshot.languages = parsed.languages.map((lang) => ({
      id: crypto.randomUUID(),
      name: lang.name,
      proficiency: lang.proficiency,
    }));
  }

  return {
    success: true,
    data: snapshot,
    warnings,
  };
}
