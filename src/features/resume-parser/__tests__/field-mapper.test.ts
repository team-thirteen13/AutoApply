import { describe, it, expect } from "vitest";
import { mapFieldsToSnapshot } from "../field-mapper";
import type { ClassifiedSection } from "../section-classifier";

describe("mapFieldsToSnapshot", () => {
  it("extracts profile information from header section", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "header",
        content: `John Doe
john.doe@example.com
+1 555-123-4567
https://github.com/johndoe
https://linkedin.com/in/johndoe`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.profile).toBeDefined();
    expect(result.profile?.name).toBe("John Doe");
    expect(result.profile?.email).toBe("john.doe@example.com");
    expect(result.profile?.phone).toBe("+1 555-123-4567");
    expect(result.profile?.githubUrl).toBe("https://github.com/johndoe");
    expect(result.profile?.linkedinUrl).toBe("https://linkedin.com/in/johndoe");
  });

  it("extracts summary text", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "summary",
        content:
          "Experienced software engineer with expertise in React and Node.js.",
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.summary).toBe(
      "Experienced software engineer with expertise in React and Node.js.",
    );
  });

  it("extracts experience entries", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "experience",
        content: `Software Engineer at Google
January 2020 - Present
• Led development of search features
• Improved performance by 40%

Junior Developer at Startup Inc
June 2018 - December 2019
• Built REST APIs
• Maintained documentation`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.experiences).toBeDefined();
    expect(result.experiences?.length).toBe(2);

    expect(result.experiences?.[0].title).toBe("Software Engineer");
    expect(result.experiences?.[0].company).toBe("Google");
    expect(result.experiences?.[0].startDate).toBe("2020-01");
    expect(result.experiences?.[0].isCurrent).toBe(true);
    expect(result.experiences?.[0].accomplishments).toContain(
      "Led development of search features",
    );

    expect(result.experiences?.[1].title).toBe("Junior Developer");
    expect(result.experiences?.[1].company).toBe("Startup Inc");
  });

  it("extracts education entries", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "education",
        content: `Bachelor of Computer Science at MIT
September 2016 - May 2020
GPA: 3.8`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.education).toBeDefined();
    expect(result.education?.length).toBe(1);
    expect(result.education?.[0].degree).toBe("Bachelor of Computer Science");
    expect(result.education?.[0].university).toBe("MIT");
    expect(result.education?.[0].startDate).toBe("2016-09");
  });

  it("extracts skills as comma-separated list", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "skills",
        content: "JavaScript, TypeScript, React, Node.js, Python",
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.skills).toBeDefined();
    expect(result.skills?.length).toBe(5);
    expect(result.skills?.[0].name).toBe("JavaScript");
    expect(result.skills?.[4].name).toBe("Python");
  });

  it("extracts languages with proficiency", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "languages",
        content: `English - Native
Spanish - Fluent
French - Basic`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.languages).toBeDefined();
    expect(result.languages?.length).toBe(3);
    expect(result.languages?.[0].name).toBe("English");
    expect(result.languages?.[0].proficiency).toBe("Native");
    expect(result.languages?.[1].name).toBe("Spanish");
    expect(result.languages?.[1].proficiency).toBe("Fluent");
  });

  it("extracts certifications", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "certifications",
        content: `AWS Solutions Architect
Amazon Web Services
2022-01`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.certificates).toBeDefined();
    expect(result.certificates?.length).toBe(1);
    expect(result.certificates?.[0].name).toBe("AWS Solutions Architect");
    expect(result.certificates?.[0].issuingOrganisation).toBe(
      "Amazon Web Services",
    );
  });

  it("extracts projects", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "projects",
        content: `E-commerce Platform
Built a full-stack e-commerce solution using React and Node.js
Technologies: React, Node.js, PostgreSQL`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.projects).toBeDefined();
    expect(result.projects?.length).toBe(1);
    expect(result.projects?.[0].title).toBe("E-commerce Platform");
    expect(result.projects?.[0].description).toContain(
      "full-stack e-commerce solution",
    );
  });

  it("returns empty object for no sections", () => {
    const result = mapFieldsToSnapshot([], "");

    expect(result.profile).toBeUndefined();
    expect(result.summary).toBeUndefined();
    expect(result.experiences).toBeUndefined();
  });

  it("handles malformed dates gracefully", () => {
    const sections: ClassifiedSection[] = [
      {
        type: "experience",
        content: `Developer at Company
Various dates
• Did work`,
      },
    ];

    const result = mapFieldsToSnapshot(sections, "");

    expect(result.experiences).toBeDefined();
    expect(result.experiences?.[0].title).toBe("Developer");
    expect(result.experiences?.[0].company).toBe("Company");
  });
});
