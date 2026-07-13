"use client";

import type { ResumeSnapshot } from "@/types/resume";

// ─────────────────────────────────────────────────────────────
// Resume Preview Sections
// ─────────────────────────────────────────────────────────────
// Renders a professional resume preview from a ResumeSnapshot.
// Used by the preview page and can be printed via browser print.
// ─────────────────────────────────────────────────────────────

interface PreviewSectionsProps {
  snapshot: ResumeSnapshot;
}

export function PreviewSections({ snapshot }: PreviewSectionsProps) {
  const { profile, experiences, education, skills, projects, certificates } =
    snapshot;

  const hasAnyContent =
    profile?.name ||
    profile?.bio ||
    (experiences && experiences.length > 0) ||
    (education && education.length > 0) ||
    (skills && skills.length > 0) ||
    (projects && projects.length > 0) ||
    (certificates && certificates.length > 0);

  if (!hasAnyContent) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No resume data to preview. Edit the resume to add content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {profile?.name && (
        <header className="border-b border-zinc-200 pb-6 dark:border-zinc-700">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {profile.name}
          </h1>
          {profile.title && (
            <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-300">
              {profile.title}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
            {profile.location && <span>{profile.location}</span>}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                LinkedIn
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Portfolio
              </a>
            )}
          </div>
        </header>
      )}

      {/* Summary */}
      {profile?.bio && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Professional Summary
          </h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {profile.bio}
          </p>
        </section>
      )}

      {/* Experience */}
      {experiences && experiences.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp, index) => (
              <div key={`exp-${index.toString()}`}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {exp.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {exp.company}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {exp.startDate} –{" "}
                    {exp.isCurrent ? "Present" : exp.endDate ?? "N/A"}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {exp.description}
                  </p>
                )}
                {exp.skills && exp.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exp.skills.map((skill, si) => (
                      <span
                        key={`exp-skill-${index.toString()}-${si.toString()}`}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={`edu-${index.toString()}`}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {edu.degree}
                      {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {edu.university}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {edu.startDate} – {edu.endDate ?? "Present"}
                  </span>
                </div>
                {edu.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`skill-${index.toString()}`}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  {skill.name}
                  {skill.category && (
                    <span className="ml-1 text-blue-500 dark:text-blue-400">
                      ({skill.category})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={`proj-${index.toString()}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                    {project.title}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        ↗
                      </a>
                    )}
                  </h3>
                </div>
                {project.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {project.technologies.map((tech, ti) => (
                      <span
                        key={`proj-tech-${index.toString()}-${ti.toString()}`}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certificates && certificates.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Certifications
          </h2>
          <div className="space-y-2">
            {certificates.map((cert, index) => (
              <div
                key={`cert-${index.toString()}`}
                className="flex items-baseline justify-between"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {cert.name}
                  </span>
                  {cert.issuingOrganisation && (
                    <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                      – {cert.issuingOrganisation}
                    </span>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      ↗
                    </a>
                  )}
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {cert.startDate}
                  {cert.endDate && ` – ${cert.endDate}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
