"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ResumeSnapshot } from "@/types/resume";
import {
  saveResumeAction,
  improveSummaryAction,
  improveExperienceAction,
} from "@/app/resumes/actions";
import { BuilderHeader } from "./builder-header";
import { BuilderSidebar, SECTIONS } from "./builder-sidebar";
import { MobileSectionNav } from "./mobile-section-nav";
import {
  PersonalInfoForm,
  SummaryForm,
  ExperienceForm,
  EducationForm,
  SkillsForm,
  ProjectsForm,
  CertificationsForm,
  LanguagesForm,
} from "./sections";
import { ResumePreview } from "@/components/preview/resume-preview";
import { Toast } from "@/components/ui/toast";

interface ResumeBuilderProps {
  resumeId: string;
  initialTitle: string;
  initialSnapshot?: ResumeSnapshot;
}

export function ResumeBuilder({
  resumeId,
  initialTitle,
  initialSnapshot,
}: ResumeBuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [snapshot, setSnapshot] = useState<ResumeSnapshot>(
    initialSnapshot ?? {},
  );
  const [activeSection, setActiveSection] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Mark dirty on changes
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Calculate completion (computed inline, not via effect)
  const completedSections = useMemo(() => {
    const completed = new Set<string>();

    if (snapshot.profile?.name && snapshot.profile?.email) {
      completed.add("personal");
    }
    if (snapshot.summary && snapshot.summary.length > 50) {
      completed.add("summary");
    }
    if (
      snapshot.experiences &&
      snapshot.experiences.length > 0 &&
      snapshot.experiences.some((e) => e.company && e.title)
    ) {
      completed.add("experience");
    }
    if (
      snapshot.education &&
      snapshot.education.length > 0 &&
      snapshot.education.some((e) => e.university && e.degree)
    ) {
      completed.add("education");
    }
    const skills = snapshot.skills;
    if (
      skills &&
      ((Array.isArray(skills) && skills.length > 0) ||
        (!Array.isArray(skills) && (skills as unknown[]).length > 0))
    ) {
      completed.add("skills");
    }
    if (snapshot.projects && snapshot.projects.length > 0) {
      completed.add("projects");
    }
    if (snapshot.certificates && snapshot.certificates.length > 0) {
      completed.add("certifications");
    }
    if (snapshot.languages && snapshot.languages.length > 0) {
      completed.add("languages");
    }

    return completed;
  }, [snapshot]);

  const completionPercentage = Math.round(
    (completedSections.size / (SECTIONS.length - 1)) * 100,
  );

  // Section update helpers
  const updateProfile = (data: ResumeSnapshot["profile"]) => {
    setSnapshot((prev) => ({ ...prev, profile: data }));
    markDirty();
  };

  const updateSummary = (data: string) => {
    setSnapshot((prev) => ({ ...prev, summary: data }));
    markDirty();
  };

  const updateExperiences = (data: NonNullable<ResumeSnapshot["experiences"]>) => {
    setSnapshot((prev) => ({ ...prev, experiences: data }));
    markDirty();
  };

  const updateEducation = (data: NonNullable<ResumeSnapshot["education"]>) => {
    setSnapshot((prev) => ({ ...prev, education: data }));
    markDirty();
  };

  const updateSkills = (data: ResumeSnapshot["skills"]) => {
    setSnapshot((prev) => ({ ...prev, skills: data }));
    markDirty();
  };

  const updateProjects = (data: NonNullable<ResumeSnapshot["projects"]>) => {
    setSnapshot((prev) => ({ ...prev, projects: data }));
    markDirty();
  };

  const updateCertifications = (
    data: NonNullable<ResumeSnapshot["certificates"]>,
  ) => {
    setSnapshot((prev) => ({ ...prev, certificates: data }));
    markDirty();
  };

  const updateLanguages = (data: NonNullable<ResumeSnapshot["languages"]>) => {
    setSnapshot((prev) => ({ ...prev, languages: data }));
    markDirty();
  };

  // AI handlers
  const handleAiImproveSummary = async (text: string): Promise<string> => {
    const result = await improveSummaryAction(text, snapshot.profile?.title);
    return result.data.bio;
  };

  const handleAiImproveExperience = async (exp: {
    company: string;
    title: string;
    accomplishments: string[];
    skills: string[];
  }) => {
    const result = await improveExperienceAction(exp);
    return result.data;
  };

  // Save handler
  const handleSave = async (andPreview = false) => {
    if (!title.trim()) {
      setToast({ message: "Please enter a resume title", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveResumeAction(resumeId, title, snapshot);
      if (result.success) {
        setIsDirty(false);
        const now = new Date().toLocaleTimeString();
        setLastSaved(now);
        setToast({ message: "Resume saved successfully", type: "success" });

        if (andPreview) {
          router.push(`/resumes/${resumeId}/preview`);
        }
      } else {
        setToast({
          message: result.error?.message ?? "Failed to save",
          type: "error",
        });
      }
    } catch {
      setToast({ message: "An unexpected error occurred", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <BuilderHeader
        title={title}
        onTitleChange={(t) => {
          setTitle(t);
          markDirty();
        }}
        completionPercentage={completionPercentage}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => handleSave(false)}
        onSaveAndPreview={() => handleSave(true)}
      />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <BuilderSidebar
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          completedSections={completedSections}
        />

        {/* Main content */}
        <div className="flex-1">
          <MobileSectionNav
            activeSection={activeSection}
            onSectionClick={scrollToSection}
            completedSections={completedSections}
          />

          <div className="space-y-8">
            {/* Personal Info */}
            <div
              ref={(el) => {
                sectionRefs.current.personal = el;
              }}
            >
              <PersonalInfoForm
                data={snapshot.profile}
                onChange={updateProfile}
                errors={{}}
              />
            </div>

            {/* Summary */}
            <div
              ref={(el) => {
                sectionRefs.current.summary = el;
              }}
            >
              <SummaryForm
                data={snapshot.summary ?? ""}
                onChange={updateSummary}
                onAiImprove={handleAiImproveSummary}
              />
            </div>

            {/* Experience */}
            <div
              ref={(el) => {
                sectionRefs.current.experience = el;
              }}
            >
              <ExperienceForm
                data={snapshot.experiences ?? []}
                onChange={updateExperiences}
                onAiImprove={handleAiImproveExperience}
              />
            </div>

            {/* Education */}
            <div
              ref={(el) => {
                sectionRefs.current.education = el;
              }}
            >
              <EducationForm
                data={snapshot.education ?? []}
                onChange={updateEducation}
              />
            </div>

            {/* Skills */}
            <div
              ref={(el) => {
                sectionRefs.current.skills = el;
              }}
            >
              <SkillsForm
                data={snapshot.skills}
                onChange={updateSkills}
              />
            </div>

            {/* Projects */}
            <div
              ref={(el) => {
                sectionRefs.current.projects = el;
              }}
            >
              <ProjectsForm
                data={snapshot.projects ?? []}
                onChange={updateProjects}
              />
            </div>

            {/* Certifications */}
            <div
              ref={(el) => {
                sectionRefs.current.certifications = el;
              }}
            >
              <CertificationsForm
                data={snapshot.certificates ?? []}
                onChange={updateCertifications}
              />
            </div>

            {/* Languages */}
            <div
              ref={(el) => {
                sectionRefs.current.languages = el;
              }}
            >
              <LanguagesForm
                data={snapshot.languages ?? []}
                onChange={updateLanguages}
              />
            </div>

            {/* Preview section */}
            <div
              ref={(el) => {
                sectionRefs.current.preview = el;
              }}
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Resume Preview
                </h2>
                <ResumePreview snapshot={snapshot} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview - Desktop */}
        <div className="hidden w-[380px] shrink-0 xl:block">
          <div className="sticky top-24">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Live Preview
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="scale-[0.55] origin-top-left" style={{ width: "182%", height: "0", paddingBottom: "141%" }}>
                <div className="absolute inset-0">
                  <ResumePreview snapshot={snapshot} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
