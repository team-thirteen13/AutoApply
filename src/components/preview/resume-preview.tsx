"use client";

import type { ResumeSnapshot } from "@/types/resume";
import type { ResumeTemplateId } from "@/lib/templates/types";
import { getEffectiveTemplateId } from "@/lib/templates";

interface ResumePreviewProps {
  snapshot: ResumeSnapshot;
}

/**
 * ResumePreview dispatches to template-specific layouts.
 * All templates share the same data sections, differing only in styling.
 */
export function ResumePreview({ snapshot }: ResumePreviewProps) {
  const templateId = getEffectiveTemplateId(snapshot.templateId);

  return <TemplateLayout templateId={templateId} snapshot={snapshot} />;
}

// ── Template dispatcher ──────────────────────────────────────

function TemplateLayout({
  templateId,
  snapshot,
}: {
  templateId: ResumeTemplateId;
  snapshot: ResumeSnapshot;
}) {
  switch (templateId) {
    case "modern":
      return <ModernLayout snapshot={snapshot} />;
    case "minimal":
      return <MinimalLayout snapshot={snapshot} />;
    case "classic":
    default:
      return <ClassicLayout snapshot={snapshot} />;
  }
}

// ── Shared content helpers ───────────────────────────────────

type SnapshotData = Pick<
  ResumeSnapshot,
  "profile" | "summary" | "experiences" | "education" | "skills" | "projects" | "certificates" | "languages"
>;

function getLocation(profile: SnapshotData["profile"]): string {
  return [profile?.city ?? profile?.location, profile?.country]
    .filter(Boolean)
    .join(", ");
}

function hasAnyContent(snapshot: SnapshotData): boolean {
  const { profile, summary, experiences, education, skills, projects, certificates, languages } = snapshot;
  return !!(
    profile?.name ||
    summary ||
    (experiences && experiences.length > 0) ||
    (education && education.length > 0) ||
    (skills && skills.length > 0) ||
    (projects && projects.length > 0) ||
    (certificates && certificates.length > 0) ||
    (languages && languages.length > 0)
  );
}

function ContactInfo({
  profile,
  className = "",
  linkClassName = "hover:underline",
}: {
  profile: SnapshotData["profile"];
  className?: string;
  linkClassName?: string;
}) {
  const location = getLocation(profile);
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}>
      {profile?.email && <span>{profile.email}</span>}
      {profile?.phone && <span>{profile.phone}</span>}
      {location && <span>{location}</span>}
      {profile?.linkedinUrl && (
        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          LinkedIn
        </a>
      )}
      {profile?.portfolioUrl && (
        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          Portfolio
        </a>
      )}
      {profile?.githubUrl && (
        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          GitHub
        </a>
      )}
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

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-slate-400">
      Start filling in your details to see a live preview
    </div>
  );
}

// ── Classic Template ─────────────────────────────────────────
// Matches the existing resume appearance (slate palette, bordered sections)

function ClassicLayout({ snapshot }: { snapshot: SnapshotData }) {
  if (!hasAnyContent(snapshot)) return <EmptyState />;

  const { profile, summary, experiences, education, skills, projects, certificates, languages } = snapshot;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-800 shadow-inner print:border-0 print:shadow-none">
      {/* Header */}
      {profile?.name && (
        <header className="mb-4 border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
          {profile.title && (
            <p className="mt-0.5 text-base font-medium text-slate-600">{profile.title}</p>
          )}
          <ContactInfo profile={profile} className="mt-2 text-xs text-slate-500" linkClassName="text-blue-600 hover:underline" />
        </header>
      )}

      {summary && (
        <Section title="Professional Summary" borderColor="border-slate-200" titleColor="text-slate-900">
          <p className="whitespace-pre-wrap text-slate-700">{summary}</p>
        </Section>
      )}

      {experiences && experiences.length > 0 && (
        <Section title="Work Experience" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div key={exp.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                    <p className="text-xs text-slate-600">
                      {exp.company}
                      {exp.employmentType && ` · ${exp.employmentType}`}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(exp.startDate)} – {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && <p className="mt-1 text-xs text-slate-600">{exp.description}</p>}
                {exp.accomplishments && exp.accomplishments.length > 0 && (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {exp.accomplishments.map((acc, i) => (
                      <li key={i} className="text-xs text-slate-700">{acc}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {education && education.length > 0 && (
        <Section title="Education" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {edu.university}{edu.location && ` · ${edu.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(edu.startDate)} – {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.grade && <p className="text-xs text-slate-500">GPA: {edu.grade}</p>}
                {edu.description && <p className="mt-0.5 text-xs text-slate-600">{edu.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills && skills.length > 0 && (
        <Section title="Skills" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {skill.name}
                {skill.proficiency && <span className="ml-1 text-slate-400">· {skill.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}

      {projects && projects.length > 0 && (
        <Section title="Projects" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={proj.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {proj.title}
                    {proj.role && <span className="font-normal text-slate-500"> · {proj.role}</span>}
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
                      {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                    </span>
                  )}
                </div>
                {proj.description && <p className="mt-0.5 text-xs text-slate-600">{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {certificates && certificates.length > 0 && (
        <Section title="Certifications" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="space-y-1">
            {certificates.map((cert, idx) => (
              <div key={cert.id ?? idx} className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{cert.name}</span>
                  {cert.issuingOrganisation && <span className="ml-1 text-xs text-slate-500">– {cert.issuingOrganisation}</span>}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {formatDate(cert.startDate)}
                  {cert.doesNotExpire ? "" : cert.endDate && ` – ${formatDate(cert.endDate)}`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {languages && languages.length > 0 && (
        <Section title="Languages" borderColor="border-slate-200" titleColor="text-slate-900">
          <div className="flex flex-wrap gap-3">
            {languages.map((lang, idx) => (
              <span key={lang.id ?? idx} className="text-xs text-slate-700">
                <span className="font-medium">{lang.name}</span>
                {lang.proficiency && <span className="text-slate-400"> · {lang.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Modern Template ──────────────────────────────────────────
// Blue accent colors, cleaner lines, slight color variation

function ModernLayout({ snapshot }: { snapshot: SnapshotData }) {
  if (!hasAnyContent(snapshot)) return <EmptyState />;

  const { profile, summary, experiences, education, skills, projects, certificates, languages } = snapshot;

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-6 text-sm text-slate-800 shadow-inner print:border-0 print:shadow-none">
      {/* Header */}
      {profile?.name && (
        <header className="mb-4 border-b-2 border-blue-600 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
          {profile.title && (
            <p className="mt-0.5 text-base font-medium text-blue-600">{profile.title}</p>
          )}
          <ContactInfo profile={profile} className="mt-2 text-xs text-slate-500" />
        </header>
      )}

      {summary && (
        <Section title="Professional Summary" borderColor="border-blue-200" titleColor="text-blue-700">
          <p className="whitespace-pre-wrap text-slate-700">{summary}</p>
        </Section>
      )}

      {experiences && experiences.length > 0 && (
        <Section title="Work Experience" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div key={exp.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                    <p className="text-xs text-blue-600">
                      {exp.company}
                      {exp.employmentType && ` · ${exp.employmentType}`}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(exp.startDate)} – {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && <p className="mt-1 text-xs text-slate-600">{exp.description}</p>}
                {exp.accomplishments && exp.accomplishments.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {exp.accomplishments.map((acc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
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

      {education && education.length > 0 && (
        <Section title="Education" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-xs text-blue-600">
                      {edu.university}{edu.location && ` · ${edu.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(edu.startDate)} – {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.grade && <p className="text-xs text-slate-500">GPA: {edu.grade}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills && skills.length > 0 && (
        <Section title="Skills" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {skill.name}
                {skill.proficiency && <span className="ml-1 text-blue-400">· {skill.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}

      {projects && projects.length > 0 && (
        <Section title="Projects" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={proj.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {proj.title}
                    {proj.role && <span className="font-normal text-slate-500"> · {proj.role}</span>}
                  </h3>
                  {(proj.startDate || proj.endDate) && (
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                    </span>
                  )}
                </div>
                {proj.description && <p className="mt-0.5 text-xs text-slate-600">{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {certificates && certificates.length > 0 && (
        <Section title="Certifications" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="space-y-1">
            {certificates.map((cert, idx) => (
              <div key={cert.id ?? idx} className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{cert.name}</span>
                  {cert.issuingOrganisation && <span className="ml-1 text-xs text-slate-500">– {cert.issuingOrganisation}</span>}
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {formatDate(cert.startDate)}
                  {cert.doesNotExpire ? "" : cert.endDate && ` – ${formatDate(cert.endDate)}`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {languages && languages.length > 0 && (
        <Section title="Languages" borderColor="border-blue-200" titleColor="text-blue-700">
          <div className="flex flex-wrap gap-3">
            {languages.map((lang, idx) => (
              <span key={lang.id ?? idx} className="text-xs text-slate-700">
                <span className="font-medium">{lang.name}</span>
                {lang.proficiency && <span className="text-slate-400"> · {lang.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Minimal Template ─────────────────────────────────────────
// Clean white, minimal borders, simple typography

function MinimalLayout({ snapshot }: { snapshot: SnapshotData }) {
  if (!hasAnyContent(snapshot)) return <EmptyState />;

  const { profile, summary, experiences, education, skills, projects, certificates, languages } = snapshot;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800 print:border-0 print:shadow-none">
      {/* Header */}
      {profile?.name && (
        <header className="mb-4 pb-4">
          <h1 className="text-2xl font-light tracking-wide text-gray-900">{profile.name}</h1>
          {profile.title && (
            <p className="mt-0.5 text-base text-gray-500">{profile.title}</p>
          )}
          <ContactInfo profile={profile} className="mt-2 text-xs text-gray-400" />
        </header>
      )}

      {summary && (
        <Section title="Summary" borderColor="border-gray-100" titleColor="text-gray-500">
          <p className="whitespace-pre-wrap text-gray-600">{summary}</p>
        </Section>
      )}

      {experiences && experiences.length > 0 && (
        <Section title="Experience" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div key={exp.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{exp.title}</h3>
                    <p className="text-xs text-gray-500">
                      {exp.company}
                      {exp.employmentType && ` · ${exp.employmentType}`}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {formatDate(exp.startDate)} – {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && <p className="mt-1 text-xs text-gray-600">{exp.description}</p>}
                {exp.accomplishments && exp.accomplishments.length > 0 && (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {exp.accomplishments.map((acc, i) => (
                      <li key={i} className="text-xs text-gray-600">{acc}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {education && education.length > 0 && (
        <Section title="Education" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={edu.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {edu.university}{edu.location && ` · ${edu.location}`}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {formatDate(edu.startDate)} – {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.grade && <p className="text-xs text-gray-400">GPA: {edu.grade}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills && skills.length > 0 && (
        <Section title="Skills" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {skill.name}
                {skill.proficiency && <span className="ml-1 text-gray-400">· {skill.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}

      {projects && projects.length > 0 && (
        <Section title="Projects" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={proj.id ?? idx}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium text-gray-900">
                    {proj.title}
                    {proj.role && <span className="font-normal text-gray-500"> · {proj.role}</span>}
                  </h3>
                  {(proj.startDate || proj.endDate) && (
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                    </span>
                  )}
                </div>
                {proj.description && <p className="mt-0.5 text-xs text-gray-600">{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="rounded border border-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {certificates && certificates.length > 0 && (
        <Section title="Certifications" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="space-y-1">
            {certificates.map((cert, idx) => (
              <div key={cert.id ?? idx} className="flex items-baseline justify-between">
                <div>
                  <span className="font-medium text-gray-900">{cert.name}</span>
                  {cert.issuingOrganisation && <span className="ml-1 text-xs text-gray-500">– {cert.issuingOrganisation}</span>}
                </div>
                <span className="whitespace-nowrap text-xs text-gray-400">
                  {formatDate(cert.startDate)}
                  {cert.doesNotExpire ? "" : cert.endDate && ` – ${formatDate(cert.endDate)}`}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {languages && languages.length > 0 && (
        <Section title="Languages" borderColor="border-gray-100" titleColor="text-gray-500">
          <div className="flex flex-wrap gap-3">
            {languages.map((lang, idx) => (
              <span key={lang.id ?? idx} className="text-xs text-gray-600">
                <span className="font-medium">{lang.name}</span>
                {lang.proficiency && <span className="text-gray-400"> · {lang.proficiency}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Shared Section component ─────────────────────────────────

function Section({
  title,
  borderColor = "border-slate-200",
  titleColor = "text-slate-900",
  children,
}: {
  title: string;
  borderColor?: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className={`mb-2 border-b ${borderColor} pb-1 text-xs font-bold uppercase tracking-wider ${titleColor}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}
