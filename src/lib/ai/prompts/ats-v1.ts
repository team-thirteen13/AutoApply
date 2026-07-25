// ─────────────────────────────────────────────────────────────
// ATS Optimization Prompt — Version ats-v1
// ─────────────────────────────────────────────────────────────
// System and user prompts for ATS resume optimization.
// Kept outside provider code for versioning and testability.
// ─────────────────────────────────────────────────────────────

import type { OptimizeResumeRequest } from "../optimization/types";

export const PROMPT_VERSION = "ats-v1";

// ── System Prompt ────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to rewrite resumes to improve ATS keyword alignment and professional impact while strictly preserving all factual accuracy.

## CORE RULES

1. The SOURCE RESUME provided by the user is the SOLE source of truth for all facts.
2. You must NEVER invent, fabricate, or hallucinate any information not present in the source resume.
3. You must NEVER add fake metrics, percentages, numbers, or quantified achievements.
4. You must NEVER add employers, job titles, dates, degrees, schools, certifications, projects, responsibilities, achievements, technologies, tools, skills, languages, locations, links, or contact information that do not exist in the source resume.
5. If a fact is missing from the source resume, it must remain missing or empty in the output.
6. You must NEVER convert vague statements into fake quantified achievements.
7. The job description is NOT evidence that the candidate possesses a skill. Do NOT add skills from the job description unless they already exist in the source resume.

## WHAT YOU MAY IMPROVE

- Professional summary relevance and impact
- Experience bullet wording and clarity
- Use of strong action verbs
- Concise professional phrasing
- ATS keyword coverage (from the job description, but only rephrasing existing content)
- Skills organization and grouping
- Consistent tense throughout
- Terminology alignment with target role
- Readability and flow
- Removal of filler language
- Keyword placement without keyword stuffing

## WHAT YOU MUST NEVER CHANGE

- Employer/company names
- Job titles
- Employment dates (start/end)
- Education institution names
- Degree names
- Education dates
- Certification names
- Certification issuers
- Certification dates
- Project names
- Contact information (name, email, phone, location, links)
- Languages (unless reordering existing ones)
- Skills (only reorder or group existing skills; do NOT add new ones)
- Factual numeric values (years of experience, team sizes, etc.)

## OUTPUT FORMAT

Return ONLY valid JSON matching the schema provided. Do not include any text outside the JSON block.`;

// ── User Prompt Builder ──────────────────────────────────────

export function buildUserPrompt(request: OptimizeResumeRequest): string {
  const sections: string[] = [];

  sections.push("## SOURCE RESUME");
  sections.push(JSON.stringify(request.resume, null, 2));

  if (request.targetJobTitle) {
    sections.push(`\n## TARGET JOB TITLE\n${request.targetJobTitle}`);
  }

  if (request.targetJobDescription) {
    sections.push(
      `\n## TARGET JOB DESCRIPTION\n${request.targetJobDescription}`,
    );
  }

  if (request.targetIndustry) {
    sections.push(`\n## TARGET INDUSTRY\n${request.targetIndustry}`);
  }

  if (request.experienceLevel) {
    sections.push(`\n## EXPERIENCE LEVEL\n${request.experienceLevel}`);
  }

  sections.push(
    `\n## INSTRUCTIONS\nOptimize this resume for ATS keyword alignment and professional impact. Rewrite the summary and experience bullet points to be stronger, more concise, and keyword-aligned with the target role. Reorganize skills if beneficial. Preserve ALL factual information exactly. Return the complete optimized ResumeSnapshot as JSON.`,
  );

  sections.push(
    `\n## REQUIRED OUTPUT FORMAT\nReturn ONLY a valid JSON object with exactly these top-level keys: "optimizedResume", "changes", "warnings".\n\nThe "optimizedResume" object must contain: "profile", "summary", "experiences", "education", "projects", "certificates", "skills", "languages".\n\nThe "changes" array must contain objects with: "section", "field", "originalValue", "optimizedValue", "reason".\n\nThe "warnings" array contains strings.\n\nExample structure:\n{\n  "optimizedResume": {\n    "profile": { "name": "...", "title": "...", "email": "...", "phone": "...", "city": "...", "country": "...", "bio": "...", "githubUrl": "...", "linkedinUrl": "...", "portfolioUrl": "..." },\n    "summary": "...",\n    "experiences": [{ "company": "...", "title": "...", "startDate": "...", "endDate": "...", "isCurrent": false, "description": "...", "accomplishments": ["..."], "skills": ["..."] }],\n    "education": [{ "university": "...", "degree": "...", "fieldOfStudy": "...", "startDate": "...", "endDate": "...", "isCurrent": false, "grade": "...", "description": "..." }],\n    "projects": [{ "title": "...", "description": "...", "technologies": ["..."], "url": "..." }],\n    "certificates": [{ "name": "...", "issuer": "...", "date": "...", "url": "..." }],\n    "skills": [{ "name": "...", "category": "...", "proficiency": "..." }],\n    "languages": [{ "name": "...", "proficiency": "..." }]\n  },\n  "changes": [{ "section": "...", "field": "...", "originalValue": "...", "optimizedValue": "...", "reason": "..." }],\n  "warnings": []\n}`,
  );

  return sections.join("\n");
}

// ── Response JSON Schema ─────────────────────────────────────

/**
 * JSON Schema for structured output validation.
 * Used with provider response_format json_schema mode.
 */
export const RESPONSE_JSON_SCHEMA = {
  name: "optimized_resume",
  strict: true,
  schema: {
    type: "object",
    properties: {
      optimizedResume: {
        type: "object",
        properties: {
          summary: { type: ["string", "null"] },
          profile: {
            type: ["object", "null"],
            properties: {
              name: { type: ["string", "null"] },
              title: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              phone: { type: ["string", "null"] },
              city: { type: ["string", "null"] },
              country: { type: ["string", "null"] },
              bio: { type: ["string", "null"] },
              githubUrl: { type: ["string", "null"] },
              linkedinUrl: { type: ["string", "null"] },
              portfolioUrl: { type: ["string", "null"] },
            },
            additionalProperties: false,
          },
          experiences: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                company: { type: "string" },
                title: { type: "string" },
                startDate: { type: "string" },
                endDate: { type: ["string", "null"] },
                isCurrent: { type: ["boolean", "null"] },
                description: { type: ["string", "null"] },
                accomplishments: {
                  type: ["array", "null"],
                  items: { type: "string" },
                },
                skills: {
                  type: ["array", "null"],
                  items: { type: "string" },
                },
              },
              required: ["company", "title", "startDate"],
              additionalProperties: false,
            },
          },
          education: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                university: { type: "string" },
                degree: { type: "string" },
                fieldOfStudy: { type: ["string", "null"] },
                startDate: { type: "string" },
                endDate: { type: ["string", "null"] },
                isCurrent: { type: ["boolean", "null"] },
                grade: { type: ["string", "null"] },
                description: { type: ["string", "null"] },
              },
              required: ["university", "degree", "startDate"],
              additionalProperties: false,
            },
          },
          projects: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: ["string", "null"] },
                technologies: {
                  type: ["array", "null"],
                  items: { type: "string" },
                },
                url: { type: ["string", "null"] },
                liveUrl: { type: ["string", "null"] },
                gitUrl: { type: ["string", "null"] },
                startDate: { type: ["string", "null"] },
                endDate: { type: ["string", "null"] },
              },
              required: ["title"],
              additionalProperties: false,
            },
          },
          certificates: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                issuingOrganisation: { type: ["string", "null"] },
                url: { type: ["string", "null"] },
                credentialId: { type: ["string", "null"] },
                startDate: { type: "string" },
                endDate: { type: ["string", "null"] },
                doesNotExpire: { type: ["boolean", "null"] },
              },
              required: ["name", "startDate"],
              additionalProperties: false,
            },
          },
          skills: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                proficiency: { type: "string" },
              },
              required: ["name", "category", "proficiency"],
              additionalProperties: false,
            },
          },
          languages: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                proficiency: { type: ["string", "null"] },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "summary",
          "profile",
          "experiences",
          "education",
          "projects",
          "certificates",
          "skills",
          "languages",
        ],
        additionalProperties: false,
      },
      changes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section: { type: "string" },
            field: { type: "string" },
            originalValue: { type: "string" },
            optimizedValue: { type: "string" },
            reason: { type: "string" },
          },
          required: ["section", "field", "originalValue", "optimizedValue", "reason"],
          additionalProperties: false,
        },
      },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["optimizedResume", "changes", "warnings"],
    additionalProperties: false,
  },
} as const;
