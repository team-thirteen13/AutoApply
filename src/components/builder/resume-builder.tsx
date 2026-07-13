"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ResumeSnapshot } from "@/types/resume";
import type { ResumeTemplateId } from "@/lib/templates/types";
import {
  saveResumeAction,
  improveSummaryAction,
  improveExperienceAction,
} from "@/app/resumes/actions";
import { BuilderHeader } from "./builder-header";
import { BuilderSidebar, SECTIONS } from "./builder-sidebar";
import { MobileSectionNav } from "./mobile-section-nav";
import { TemplateSelector } from "./template-selector";
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
import { VersionHistory } from "./version-history";
import { Toast } from "@/components/ui/toast";
import {
  validateSection,
  findFirstInvalidSection,
  type BuilderSectionId,
} from "@/lib/validation/builder";
import { normalizeSkills } from "@/lib/skills-normalize";
import { normalizeSnapshotTemplate, getEffectiveTemplateId } from "@/lib/templates";

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
  const [snapshot, setSnapshot] = useState<ResumeSnapshot>(() => {
    const initial = initialSnapshot ?? {};
    // Normalize at load boundary: skills + templateId
    let normalized = initial;
    if (normalized.skills) {
      normalized = { ...normalized, skills: normalizeSkills(normalized.skills) };
    }
    normalized = normalizeSnapshotTemplate(normalized);
    return normalized;
  });
  const [activeSection, setActiveSection] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [sectionErrors, setSectionErrors] = useState<
    Record<BuilderSectionId, Record<string, string>>
  >({
    personal: {},
    summary: {},
    experience: {},
    education: {},
    skills: {},
    projects: {},
    certifications: {},
    languages: {},
  });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  // Version history state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionCount, setVersionCount] = useState(0);

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

  // Calculate completion using schema validation
  const completedSections = useMemo(() => {
    const completed = new Set<string>();

    // Personal: name and email required
    const personalResult = validateSection("personal", snapshot.profile ?? {});
    if (personalResult.valid) {
      completed.add("personal");
    }

    // Summary: optional, but complete if present and > 50 chars
    if (snapshot.summary && snapshot.summary.length > 50) {
      completed.add("summary");
    }

    // Experience: at least one valid entry
    if (snapshot.experiences && snapshot.experiences.length > 0) {
      const experienceResult = validateSection("experience", snapshot.experiences);
      if (experienceResult.valid) {
        completed.add("experience");
      }
    }

    // Education: at least one valid entry
    if (snapshot.education && snapshot.education.length > 0) {
      const educationResult = validateSection("education", snapshot.education);
      if (educationResult.valid) {
        completed.add("education");
      }
    }

    // Skills: at least one valid entry
    if (snapshot.skills && snapshot.skills.length > 0) {
      const skillsResult = validateSection("skills", snapshot.skills);
      if (skillsResult.valid) {
        completed.add("skills");
      }
    }

    // Projects: at least one entry
    if (snapshot.projects && snapshot.projects.length > 0) {
      completed.add("projects");
    }

    // Certifications: at least one entry
    if (snapshot.certificates && snapshot.certificates.length > 0) {
      completed.add("certifications");
    }

    // Languages: at least one entry
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

  const updateTemplate = useCallback((templateId: ResumeTemplateId) => {
    setSnapshot((prev) => {
      if (prev.templateId === templateId) return prev;
      return { ...prev, templateId };
    });
    // Always mark dirty — the check above prevents state churn but
    // markDirty is idempotent so calling it on same-template click is safe
    markDirty();
  }, [markDirty]);

  // Fetch initial version count
  useEffect(() => {
    import("@/app/resumes/actions").then(({ listVersionsAction }) =>
      listVersionsAction(resumeId).then((result) => {
        if (result.success) {
          setVersionCount(result.data.length);
        }
      }),
    );
  }, [resumeId]);

  // Handle restore: replace builder snapshot with restored version
  const handleRestore = useCallback(
    (restoredSnapshot: ResumeSnapshot) => {
      setSnapshot(restoredSnapshot);
      setIsDirty(false);
      setHistoryOpen(false);
      setVersionCount((prev) => prev + 1);
      setToast({
        message: "Version restored successfully",
        type: "success",
      });
    },
    [],
  );

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

  // Validate all sections and collect errors
  const validateAllSections = useCallback(() => {
    const newErrors: Record<BuilderSectionId, Record<string, string>> = {
      personal: {},
      summary: {},
      experience: {},
      education: {},
      skills: {},
      projects: {},
      certifications: {},
      languages: {},
    };

    // Validate personal info
    const personalResult = validateSection("personal", snapshot.profile ?? {});
    if (!personalResult.valid) {
      newErrors.personal = personalResult.errors;
    }

    // Validate experience entries
    if (snapshot.experiences && snapshot.experiences.length > 0) {
      const experienceResult = validateSection("experience", snapshot.experiences);
      if (!experienceResult.valid) {
        newErrors.experience = experienceResult.errors;
      }
    }

    // Validate education entries
    if (snapshot.education && snapshot.education.length > 0) {
      const educationResult = validateSection("education", snapshot.education);
      if (!educationResult.valid) {
        newErrors.education = educationResult.errors;
      }
    }

    // Validate skills entries
    if (snapshot.skills && snapshot.skills.length > 0) {
      const skillsResult = validateSection("skills", snapshot.skills);
      if (!skillsResult.valid) {
        newErrors.skills = skillsResult.errors;
      }
    }

    setSectionErrors(newErrors);
    return newErrors;
  }, [snapshot]);

  // Save handler
  const handleSave = async (andPreview = false) => {
    if (!title.trim()) {
      setToast({ message: "Please enter a resume title", type: "error" });
      return;
    }

    // Validate all sections before save
    const errors = validateAllSections();
    const hasErrors = Object.values(errors).some(
      (e) => Object.keys(e).length > 0,
    );

    if (hasErrors) {
      // Find first invalid section and navigate to it
      const firstInvalid = findFirstInvalidSection({
        profile: snapshot.profile,
        summary: snapshot.summary,
        experiences: snapshot.experiences,
        education: snapshot.education,
        skills: snapshot.skills,
        projects: snapshot.projects,
        certificates: snapshot.certificates,
        languages: snapshot.languages,
      });

      if (firstInvalid) {
        scrollToSection(firstInvalid);
      }

      setToast({
        message: "Please fix validation errors before saving",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveResumeAction(resumeId, title, snapshot);
      if (result.success) {
        setIsDirty(false);
        const now = new Date().toLocaleTimeString();
        setLastSaved(now);
        setVersionCount((prev) => prev + 1);
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
        onOpenHistory={() => setHistoryOpen(true)}
        versionCount={versionCount}
        historyButtonRef={historyButtonRef}
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
            {/* Template Selection */}
            <TemplateSelector
              selected={getEffectiveTemplateId(snapshot.templateId)}
              onChange={updateTemplate}
            />

            {/* Personal Info */}
            <div
              ref={(el) => {
                sectionRefs.current.personal = el;
              }}
            >
              <PersonalInfoForm
                data={snapshot.profile}
                onChange={updateProfile}
                errors={sectionErrors.personal}
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
                errors={sectionErrors.summary}
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
                errors={sectionErrors.experience}
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
                errors={sectionErrors.education}
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
                errors={sectionErrors.skills}
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
                errors={sectionErrors.projects}
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
                errors={sectionErrors.certifications}
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
                errors={sectionErrors.languages}
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

      {/* Version History Panel */}
      <VersionHistory
        open={historyOpen}
        resumeId={resumeId}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
        historyButtonRef={historyButtonRef}
      />

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
