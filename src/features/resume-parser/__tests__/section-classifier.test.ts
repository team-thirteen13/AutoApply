import { describe, it, expect } from "vitest";
import { classifySections } from "../section-classifier";

describe("classifySections", () => {
  it("classifies a simple resume with common sections", () => {
    const text = `John Doe
john@example.com
+1 555-123-4567

Professional Summary
Experienced software engineer with 5 years of experience.

Work Experience
Software Engineer at Acme Corp
January 2020 - Present
• Led development of microservices
• Improved performance by 40%

Education
Bachelor of Computer Science at MIT
September 2016 - May 2020

Skills
JavaScript, TypeScript, React, Node.js

Languages
English - Native
Spanish - Fluent`;

    const sections = classifySections(text);

    expect(sections.length).toBeGreaterThan(0);

    // Check that we identified the key sections
    const types = sections.map((s) => s.type);
    expect(types).toContain("summary");
    expect(types).toContain("experience");
    expect(types).toContain("education");
    expect(types).toContain("skills");
    expect(types).toContain("languages");
  });

  it("handles section headers in different cases", () => {
    const text = `SUMMARY
Quick summary

EXPERIENCE
Job at Company

EDUCATION
Degree at University

SKILLS
JavaScript`;

    const sections = classifySections(text);
    const types = sections.map((s) => s.type);

    expect(types).toContain("summary");
    expect(types).toContain("experience");
    expect(types).toContain("education");
    expect(types).toContain("skills");
  });

  it("handles common section header synonyms", () => {
    const text = `PROFESSIONAL EXPERIENCE
Job at Company

TECHNICAL SKILLS
JavaScript

LANGUAGES SPOKEN
English

CERTIFICATIONS
AWS Certified

PROJECTS
Personal project`;

    const sections = classifySections(text);
    const types = sections.map((s) => s.type);

    expect(types).toContain("experience");
    expect(types).toContain("skills");
    expect(types).toContain("languages");
    expect(types).toContain("certifications");
    expect(types).toContain("projects");
  });

  it("returns header section for text before first recognized section", () => {
    const text = `John Doe
john@example.com

EXPERIENCE
Job at Company`;

    const sections = classifySections(text);
    const headerSection = sections.find((s) => s.type === "header");

    expect(headerSection).toBeDefined();
    expect(headerSection?.content).toContain("John Doe");
    expect(headerSection?.content).toContain("john@example.com");
  });

  it("handles empty text", () => {
    const sections = classifySections("");
    expect(sections).toEqual([]);
  });

  it("handles text with no recognized sections", () => {
    const text = `Just some random text without any section headers.`;
    const sections = classifySections(text);

    expect(sections.length).toBe(1);
    expect(sections[0].type).toBe("header");
  });

  it("preserves content within sections", () => {
    const text = `SUMMARY
This is my professional summary.
It has multiple lines.

EXPERIENCE
Company A
January 2020 - Present
• Did something great`;

    const sections = classifySections(text);
    const summarySection = sections.find((s) => s.type === "summary");

    expect(summarySection?.content).toContain("This is my professional summary");
    expect(summarySection?.content).toContain("multiple lines");
  });
});
