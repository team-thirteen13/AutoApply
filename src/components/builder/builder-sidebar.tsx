"use client";

import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Languages,
  Eye,
  CheckCircle2,
} from "lucide-react";

export interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
}

export const SECTIONS: Section[] = [
  { id: "personal", label: "Personal Information", icon: User, required: true },
  { id: "summary", label: "Professional Summary", icon: FileText },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "preview", label: "Review & Preview", icon: Eye },
];

interface BuilderSidebarProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  completedSections: Set<string>;
}

export function BuilderSidebar({
  activeSection,
  onSectionClick,
  completedSections,
}: BuilderSidebarProps) {
  return (
    <nav className="sticky top-20 hidden w-56 shrink-0 lg:block" aria-label="Resume sections">
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Sections
        </p>
        <ul className="space-y-0.5" role="list">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isCompleted = completedSections.has(section.id);
            const Icon = section.icon;

            return (
              <li key={section.id}>
                <button
                  onClick={() => onSectionClick(section.id)}
                  aria-label={`${section.label}${section.required ? " (required)" : ""}${isCompleted ? " (completed)" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-emerald-500"
                          : "text-slate-400"
                    }`}
                  />
                  <span className="flex-1 truncate">{section.label}</span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {section.required && !isCompleted && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
