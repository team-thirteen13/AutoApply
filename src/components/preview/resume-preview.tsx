"use client";

import type { ResumeSnapshot } from "@/types/resume";

interface ResumePreviewProps {
  snapshot: ResumeSnapshot;
}

export function ResumePreview({ snapshot }: ResumePreviewProps) {
  const { profile, summary, experiences, education, skills, projects, certificates, languages } = snapshot;

  const location = [profile?.city ?? profile?.location, profile?.country]
    .filter(Boolean)
    .join(", ");

  const hasContent =
    profile?.name ||
    summary ||
    (experiences && experiences.length > 0) ||
    (education && education.length > 0) ||
    (projects && projects.length > 0) ||
    (certificates && certificates.length > 0) ||
    (languages && languages.length > 0);

  if (!hasContent) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Start filling in your details to see a live preview
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-800 shadow-inner print:border-0 print:shadow-none">
      {/* Header */}
      {profile?.name && (
        <header className="mb-4 border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
          {profile.title && (
            <p className="mt-0.5 text-base font-medium text-slate-600">
              {profile.title}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
            {location && <span>{location}</span>}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Portfolio
              </a>
            )}
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
            )}
          </div>
        </header>
      )}

      {/* Summary */}
      {summary && (
        <Section title="Professional Summary">
          <p className="whitespace-pre-wrap text-slate-700">{summary}</p>
        </Section>
      )}

      {/* Experience */}
      {experiences && experiences.length > 0 && (
        <Section title="Work Experience">
          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div key={exp.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {exp.company}
                      {exp.employmentType && ` · ${exp.employmentType}`}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(exp.startDate)} –{" "}
                    {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && (
                  <p className="mt-1 text-xs text-slate-600">
                    {exp.description}
                  </p>
                )}
                {exp.accomplishments && exp.accomplishments.length > 0 && (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {exp.accomplishments.map((acc, i) => (
                      <li key={i} className="text-xs text-slate-700">
                        {acc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree}
                      {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {edu.university}
                      {edu.location && ` · ${edu.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(edu.startDate)} –{" "}
                    {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.grade && (
                  <p className="text-xs text-slate-500">GPA: {edu.grade}</p>
                )}
                {edu.description && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
              >
                {skill.name}
                {skill.proficiency && (
                  <span className="ml-1 text-slate-400">
                    · {skill.proficiency}
                  </span>
                )}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <Section title="Projects">
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={proj.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {proj.title}
                    {proj.role && (
                      <span className="font-normal text-slate-500">
                        {" "}
                       · {proj.role}
                      </span>
                    )}
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        ↗
                      </a>
                    )}
                  </h3>
                  {(proj.startDate || proj.endDate) && (
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {formatDate(proj.startDate)} –{" "}
                      {formatDate(proj.endDate)}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    {proj.description}
                  </p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certificates && certificates.length > 0 && (
        <Section title="Certifications">
          <div className="space-y-1">
            {certificates.map((cert, idx) => (
              <div
                key={cert.id ?? idx}
                className="flex items-baseline justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {cert.name}
                  </span>
                  {cert.issuingOrganisation && (
                    <span className="ml-1 text-xs text-slate-500">
                      – {cert.issuingOrganisation}
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {formatDate(cert.startDate)}
                  {cert.doesNotExpire
                    ? ""
                    : cert.endDate && ` – ${formatDate(cert.endDate)}`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <Section title="Languages">
          <div className="flex flex-wrap gap-3">
            {languages.map((lang, idx) => (
              <span key={lang.id ?? idx} className="text-xs text-slate-700">
                <span className="font-medium">{lang.name}</span>
                {lang.proficiency && (
                  <span className="text-slate-400"> · {lang.proficiency}</span>
                )}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-900">
        {title}
      </h2>
      {children}
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  if (!month) return year ?? "";
  const date = new Date(parseInt(year ?? "0"), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
