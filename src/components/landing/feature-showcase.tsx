// ─────────────────────────────────────────────────────────────
// Feature Showcase Section
// ─────────────────────────────────────────────────────────────
// 2x3 responsive grid of 6 resume builder features.
// Server component — static content, no interactivity.
// ─────────────────────────────────────────────────────────────

import { FeatureCard } from "./feature-card";

// ── Custom SVG Icon Components ──────────────────────────────

function ResumeCreationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}

function ProfileManagementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  );
}

function ExperienceTrackingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12" />
    </svg>
  );
}

function EducationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ProjectListingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function SkillManagementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const features = [
  {
    icon: ResumeCreationIcon,
    title: "Resume Creation",
    description:
      "Build professional resumes with AI-powered suggestions and customizable templates.",
    gradient: "from-blue-900/80 to-slate-800/90",
  },
  {
    icon: ProfileManagementIcon,
    title: "Profile Management",
    description:
      "Centralize your career history in one reusable profile that powers all your resumes.",
    gradient: "from-blue-800/80 to-cyan-900/80",
  },
  {
    icon: ExperienceTrackingIcon,
    title: "Experience Tracking",
    description:
      "Organize your work experience with detailed descriptions, dates, and achievements.",
    gradient: "from-emerald-900/80 to-teal-800/80",
  },
  {
    icon: EducationIcon,
    title: "Education",
    description:
      "Showcase your academic background with degrees, institutions, and relevant coursework.",
    gradient: "from-purple-900/80 to-violet-800/80",
  },
  {
    icon: ProjectListingsIcon,
    title: "Project Listings",
    description:
      "Highlight your best projects with descriptions, links, and technology stacks.",
    gradient: "from-blue-900/80 to-indigo-800/80",
  },
  {
    icon: SkillManagementIcon,
    title: "Skill Management",
    description:
      "Curate and organize your technical and soft skills for targeted job applications.",
    gradient: "from-cyan-900/80 to-blue-800/80",
  },
];

export function FeatureShowcase() {
  return (
    <section className="py-24 bg-features-start">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-text-primary">
            Everything you need to build the perfect resume
          </h2>
          <p className="mt-4 text-text-secondary">
            AutoApply gives you the tools to create, manage, and optimize your
            professional resume.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
