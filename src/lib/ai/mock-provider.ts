// ─────────────────────────────────────────────────────────────
// Mock AI Provider
// ─────────────────────────────────────────────────────────────
// Deterministic mock implementation of AIProvider for testing
// and development. Returns realistic but static responses.
// No external API calls — safe to run in any environment.
// ─────────────────────────────────────────────────────────────

import type {
  AIProvider,
  AIResult,
  ImproveSummaryInput,
  ImproveSummaryOutput,
  ImproveExperienceInput,
  ImproveExperienceOutput,
  ImproveSkillsInput,
  ImproveSkillsOutput,
  GenerateResumeInput,
  GenerateResumeOutput,
} from "./types";
import type { ResumeSnapshot } from "@/types/resume";
import { normalizeToISODate } from "@/lib/date-normalize";

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async improveSummary(
    input: ImproveSummaryInput,
  ): Promise<AIResult<ImproveSummaryOutput>> {
    const { bio, targetRole } = input;

    // If bio is empty, return a template
    if (!bio.trim()) {
      const role = targetRole ?? "software engineer";
      return {
        data: {
          bio: `Results-driven ${role} with a passion for building scalable, user-focused applications. Experienced in modern web technologies and collaborative team environments.`,
        },
        provider: this.name,
        note: "Generated template bio for empty input",
      };
    }

    // Otherwise, polish the existing bio
    const polished = bio
      .replace(/\bi am\b/gi, "I am a")
      .replace(/\bi have\b/gi, "I have extensive experience in")
      .replace(/\bworked on\b/gi, "contributed to")
      .replace(/\bbuilt\b/gi, "engineered")
      .replace(/\bhelped\b/gi, "collaborated with teams to")
      .replace(/\bdid\b/gi, "executed")
      .replace(/\bthing\b/gi, "initiative")
      .replace(/\bstuff\b/gi, "projects")
      .replace(/\bvery\b/gi, "exceptionally")
      .replace(/\bnice\b/gi, "well-crafted");

    return {
      data: { bio: polished },
      provider: this.name,
      note: "Polished language and improved phrasing",
    };
  }

  async improveExperience(
    input: ImproveExperienceInput,
  ): Promise<AIResult<ImproveExperienceOutput>> {
    const { experience } = input;

    // Improve accomplishments: ensure they start with action verbs
    const actionVerbs = [
      "Led", "Built", "Implemented", "Designed", "Optimized",
      "Developed", "Architected", "Launched", "Delivered", "Streamlined",
    ];

    const improvedAccomplishments = experience.accomplishments.map(
      (item, index) => {
        // If already starts with an action verb, keep as-is
        if (actionVerbs.some((verb) => item.startsWith(verb))) {
          return item;
        }
        // Prepend a contextual action verb
        const verb = actionVerbs[index % actionVerbs.length];
        const cleaned = item.charAt(0).toLowerCase() + item.slice(1);
        return `${verb} ${cleaned}`;
      },
    );

    // Deduplicate and clean skills
    const improvedSkills = [
      ...new Set(experience.skills.map((s) => s.trim()).filter(Boolean)),
    ];

    return {
      data: {
        accomplishments: improvedAccomplishments,
        skills: improvedSkills,
      },
      provider: this.name,
      note: "Added action verbs to accomplishments, deduplicated skills",
    };
  }

  async improveSkills(
    input: ImproveSkillsInput,
  ): Promise<AIResult<ImproveSkillsOutput>> {
    const { skills } = input;

    // Deduplicate, trim, sort alphabetically, remove empties
    const improved = [
      ...new Set(skills.map((s) => s.trim()).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    return {
      data: { skills: improved },
      provider: this.name,
      note: `Deduplicated and sorted ${skills.length} skills → ${improved.length} unique`,
    };
  }

  async generateResume(
    input: GenerateResumeInput,
  ): Promise<AIResult<GenerateResumeOutput>> {
    const { profile, experiences, education, projects, certificates, skills, targetRole } = input;

    // Build profile section
    const profileSection = profile
      ? {
          name: profile.name,
          title: profile.title,
          email: profile.email,
          phone: profile.phone,
          city: profile.city,
          country: profile.country,
          bio: profile.bio,
          githubUrl: profile.githubUrl,
          linkedinUrl: profile.linkedinUrl,
          portfolioUrl: profile.portfolioUrl,
        }
      : undefined;

    // Build summary from profile bio or generate template
    let summary: string | undefined;
    if (profile?.bio?.trim()) {
      summary = profile.bio;
    } else {
      const role = targetRole ?? profile?.title ?? "professional";
      summary = `Results-driven ${role} with experience in building scalable applications and collaborative team environments.`;
    }

    // Map experiences, preserving source facts and normalizing dates
    const experienceSection = experiences?.map((exp) => ({
      company: exp.company,
      title: exp.title,
      startDate: normalizeToISODate(exp.startDate) as string,
      endDate: normalizeToISODate(exp.endDate),
      isCurrent: exp.isCurrent,
      description: exp.description,
      accomplishments: exp.accomplishments ?? [],
      skills: exp.skills ?? [],
    }));

    // Map education, preserving source facts and normalizing dates
    const educationSection = education?.map((edu) => ({
      university: edu.university,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: normalizeToISODate(edu.startDate) as string,
      endDate: normalizeToISODate(edu.endDate),
      isCurrent: edu.isCurrent,
      grade: edu.grade,
      description: edu.description,
    }));

    // Map projects, preserving source facts and normalizing dates
    const projectSection = projects?.map((proj) => ({
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies ?? [],
      url: proj.url,
      liveUrl: proj.liveUrl,
      gitUrl: proj.gitUrl,
      // startDate in projects is string | undefined (null not allowed)
      startDate: normalizeToISODate(proj.startDate) ?? undefined,
      endDate: normalizeToISODate(proj.endDate),
    }));

    // Map certificates, preserving source facts and normalizing dates
    const certificateSection = certificates?.map((cert) => ({
      name: cert.name,
      issuingOrganisation: cert.issuingOrganisation,
      url: cert.url,
      credentialId: cert.credentialId,
      startDate: normalizeToISODate(cert.startDate) as string,
      endDate: normalizeToISODate(cert.endDate),
      doesNotExpire: cert.doesNotExpire,
    }));

    // Deduplicate and sort skills, convert to object form
    const skillSection = skills
      ? [...new Set(skills.map((s) => s.trim()).filter(Boolean))].sort(
          (a, b) => a.localeCompare(b),
        ).map((name) => ({ name, category: "", proficiency: "" }))
      : undefined;

    const snapshot: ResumeSnapshot = {
      profile: profileSection,
      summary,
      experiences: experienceSection,
      education: educationSection,
      projects: projectSection,
      certificates: certificateSection,
      skills: skillSection,
    };

    return {
      data: { snapshot },
      provider: this.name,
      note: "Generated resume snapshot from provided career data",
    };
  }
}
