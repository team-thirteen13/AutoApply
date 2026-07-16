// ─────────────────────────────────────────────────────────────
// Feature Showcase Section
// ─────────────────────────────────────────────────────────────
// 2x3 responsive grid of 6 resume builder features.
// Server component — static content, no interactivity.
// ─────────────────────────────────────────────────────────────

import {
  FileText,
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Wrench,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: FileText,
    title: "Resume Creation",
    description:
      "Build professional resumes with AI-powered suggestions and customizable templates.",
  },
  {
    icon: User,
    title: "Profile Management",
    description:
      "Centralize your career history in one reusable profile that powers all your resumes.",
  },
  {
    icon: Briefcase,
    title: "Experience Tracking",
    description:
      "Organize your work experience with detailed descriptions, dates, and achievements.",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Showcase your academic background with degrees, institutions, and relevant coursework.",
  },
  {
    icon: FolderOpen,
    title: "Project Listings",
    description:
      "Highlight your best projects with descriptions, links, and technology stacks.",
  },
  {
    icon: Wrench,
    title: "Skill Management",
    description:
      "Curate and organize your technical and soft skills for targeted job applications.",
  },
];

export function FeatureShowcase() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
