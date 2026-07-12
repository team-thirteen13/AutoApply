"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import type { ResumeSnapshot } from "@/types/resume";
import {
  saveResumeAction,
  improveSummaryAction,
  improveExperienceAction,
} from "@/app/resumes/actions";

// ─────────────────────────────────────────────────────────────
// CV Builder Form
// ─────────────────────────────────────────────────────────────
// Temporary integration UI for testing resume creation and editing.
// Multi-section form with client-side validation, AI improve
// actions, and unsaved changes tracking.
// ─────────────────────────────────────────────────────────────

interface CVBuilderFormProps {
  resumeId: string;
  initialTitle: string;
  initialSnapshot?: ResumeSnapshot;
}

interface FormErrors {
  title?: string;
  [key: string]: string | undefined;
}

export function CVBuilderForm({
  resumeId,
  initialTitle,
  initialSnapshot,
}: CVBuilderFormProps) {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────
  const [title, setTitle] = useState(initialTitle);
  const [snapshot, setSnapshot] = useState<ResumeSnapshot>(
    initialSnapshot ?? {},
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // ── Mark as dirty on any change ─────────────────────────
  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveMessage(null);
  }, []);

  // ── Unsaved changes warning ─────────────────────────────
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    },
    [isDirty],
  );

  // Register/unregister beforeunload
  useState(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  // ── Validation ──────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Resume title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save handler ────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await saveResumeAction(resumeId, title, snapshot);

      if (result.success) {
        setIsDirty(false);
        setSaveMessage({ type: "success", text: "Resume saved successfully" });
      } else {
        setSaveMessage({
          type: "error",
          text: result.error?.message ?? "Failed to save resume",
        });
      }
    } catch {
      setSaveMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── AI Improve Summary ──────────────────────────────────
  const handleImproveSummary = async () => {
    const bio = snapshot.profile?.bio ?? "";
    setAiLoading("summary");

    try {
      const result = await improveSummaryAction(bio, snapshot.profile?.title);
      if (result.data.bio) {
        setSnapshot((prev) => ({
          ...prev,
          profile: { ...prev.profile, bio: result.data.bio },
        }));
        markDirty();
      }
    } catch {
      // Silently fail for AI actions
    } finally {
      setAiLoading(null);
    }
  };

  // ── AI Improve Experience ───────────────────────────────
  const handleImproveExperience = async (index: number) => {
    const exp = snapshot.experiences?.[index];
    if (!exp) return;

    setAiLoading(`exp-${index}`);

    try {
      const result = await improveExperienceAction({
        company: exp.company,
        title: exp.title,
        accomplishments: exp.accomplishments ?? [],
        skills: exp.skills ?? [],
      });

      if (result.data) {
        setSnapshot((prev) => {
          const experiences = [...(prev.experiences ?? [])];
          experiences[index] = {
            ...experiences[index],
            description: result.data.accomplishments.join("\n"),
            skills: result.data.skills,
          };
          return { ...prev, experiences };
        });
        markDirty();
      }
    } catch {
      // Silently fail for AI actions
    } finally {
      setAiLoading(null);
    }
  };

  // ── Section helpers ─────────────────────────────────────
  const addExperience = () => {
    setSnapshot((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences ?? []),
        {
          company: "",
          title: "",
          location: "",
          startDate: "",
          endDate: null,
          isCurrent: false,
          description: "",
          skills: [],
        },
      ],
    }));
    markDirty();
  };

  const removeExperience = (index: number) => {
    setSnapshot((prev) => ({
      ...prev,
      experiences: (prev.experiences ?? []).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const updateExperience = (
    index: number,
    field: string,
    value: string | boolean | null,
  ) => {
    setSnapshot((prev) => {
      const experiences = [...(prev.experiences ?? [])];
      experiences[index] = { ...experiences[index], [field]: value };
      return { ...prev, experiences };
    });
    markDirty();
  };

  const addEducation = () => {
    setSnapshot((prev) => ({
      ...prev,
      education: [
        ...(prev.education ?? []),
        {
          university: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: null,
          description: "",
        },
      ],
    }));
    markDirty();
  };

  const removeEducation = (index: number) => {
    setSnapshot((prev) => ({
      ...prev,
      education: (prev.education ?? []).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const updateEducation = (
    index: number,
    field: string,
    value: string | null,
  ) => {
    setSnapshot((prev) => {
      const education = [...(prev.education ?? [])];
      education[index] = { ...education[index], [field]: value };
      return { ...prev, education };
    });
    markDirty();
  };

  const addSkill = () => {
    setSnapshot((prev) => ({
      ...prev,
      skills: [
        ...((prev.skills as Array<{ name: string; category?: string }>) ?? []),
        { name: "", category: "" },
      ],
    }));
    markDirty();
  };

  const removeSkill = (index: number) => {
    setSnapshot((prev) => ({
      ...prev,
      skills: ((prev.skills as Array<{ name: string; category?: string }>) ?? [
      ]).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const updateSkill = (index: number, field: string, value: string) => {
    setSnapshot((prev) => {
      const skills = [
        ...((prev.skills as Array<{ name: string; category?: string }>) ?? []),
      ];
      skills[index] = { ...skills[index], [field]: value };
      return { ...prev, skills };
    });
    markDirty();
  };

  const addProject = () => {
    setSnapshot((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects ?? []),
        {
          title: "",
          description: "",
          technologies: [],
          url: "",
        },
      ],
    }));
    markDirty();
  };

  const removeProject = (index: number) => {
    setSnapshot((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const updateProject = (
    index: number,
    field: string,
    value: string | string[],
  ) => {
    setSnapshot((prev) => {
      const projects = [...(prev.projects ?? [])];
      projects[index] = { ...projects[index], [field]: value };
      return { ...prev, projects };
    });
    markDirty();
  };

  const addCertificate = () => {
    setSnapshot((prev) => ({
      ...prev,
      certificates: [
        ...(prev.certificates ?? []),
        {
          name: "",
          issuingOrganisation: "",
          url: "",
          startDate: "",
          endDate: null,
        },
      ],
    }));
    markDirty();
  };

  const removeCertificate = (index: number) => {
    setSnapshot((prev) => ({
      ...prev,
      certificates: (prev.certificates ?? []).filter((_, i) => i !== index),
    }));
    markDirty();
  };

  const updateCertificate = (
    index: number,
    field: string,
    value: string | null,
  ) => {
    setSnapshot((prev) => {
      const certificates = [...(prev.certificates ?? [])];
      certificates[index] = { ...certificates[index], [field]: value };
      return { ...prev, certificates };
    });
    markDirty();
  };

  // ── Input class helper ──────────────────────────────────
  const inputClass =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";
  const labelClass =
    "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
  const sectionClass =
    "rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className="space-y-6">
      {/* Save message */}
      {saveMessage && (
        <div
          className={`rounded-md p-3 text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Resume Title */}
      <div className={sectionClass}>
        <label htmlFor="resume-title" className={labelClass}>
          Resume Title *
        </label>
        <input
          id="resume-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="e.g. Software Engineer Resume"
          className={inputClass}
          aria-required="true"
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.title}
          </p>
        )}
      </div>

      {/* Personal Information */}
      <div className={sectionClass}>
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className={labelClass}>
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={snapshot.profile?.name ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, name: e.target.value },
                }));
                markDirty();
              }}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-title" className={labelClass}>
              Professional Title
            </label>
            <input
              id="profile-title"
              type="text"
              value={snapshot.profile?.title ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, title: e.target.value },
                }));
                markDirty();
              }}
              placeholder="Software Engineer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-email" className={labelClass}>
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={snapshot.profile?.email ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, email: e.target.value },
                }));
                markDirty();
              }}
              placeholder="john@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={snapshot.profile?.phone ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, phone: e.target.value },
                }));
                markDirty();
              }}
              placeholder="+1 234 567 890"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-location" className={labelClass}>
              Location
            </label>
            <input
              id="profile-location"
              type="text"
              value={snapshot.profile?.location ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, location: e.target.value },
                }));
                markDirty();
              }}
              placeholder="New York, NY"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="profile-linkedin" className={labelClass}>
              LinkedIn
            </label>
            <input
              id="profile-linkedin"
              type="url"
              value={snapshot.profile?.linkedinUrl ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, linkedinUrl: e.target.value },
                }));
                markDirty();
              }}
              placeholder="https://linkedin.com/in/johndoe"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-portfolio" className={labelClass}>
              Portfolio
            </label>
            <input
              id="profile-portfolio"
              type="url"
              value={snapshot.profile?.portfolioUrl ?? ""}
              onChange={(e) => {
                setSnapshot((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, portfolioUrl: e.target.value },
                }));
                markDirty();
              }}
              placeholder="https://johndoe.dev"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Professional Summary
          </h3>
          <button
            type="button"
            onClick={handleImproveSummary}
            disabled={aiLoading === "summary"}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            {aiLoading === "summary" ? "Improving..." : "✨ AI Improve"}
          </button>
        </div>
        <label htmlFor="profile-bio" className={labelClass}>
          Summary
        </label>
        <textarea
          id="profile-bio"
          value={snapshot.profile?.bio ?? ""}
          onChange={(e) => {
            setSnapshot((prev) => ({
              ...prev,
              profile: { ...prev.profile, bio: e.target.value },
            }));
            markDirty();
          }}
          placeholder="Write a brief professional summary..."
          rows={4}
          className={inputClass}
        />
      </div>

      {/* Work Experience */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Work Experience
          </h3>
          <button
            type="button"
            onClick={addExperience}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + Add Experience
          </button>
        </div>

        {(snapshot.experiences ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No work experience added yet.
          </p>
        )}

        {(snapshot.experiences ?? []).map((exp, index) => (
          <div
            key={`exp-${index.toString()}`}
            className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Experience #{index + 1}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleImproveExperience(index)}
                  disabled={aiLoading === `exp-${index}`}
                  className="rounded-md bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiLoading === `exp-${index}` ? "..." : "✨ AI Improve"}
                </button>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Company *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(index, "company", e.target.value)
                  }
                  placeholder="Acme Inc."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Position *</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) =>
                    updateExperience(index, "title", e.target.value)
                  }
                  placeholder="Software Engineer"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={exp.location ?? ""}
                  onChange={(e) =>
                    updateExperience(index, "location", e.target.value)
                  }
                  placeholder="San Francisco, CA"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Date *</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) =>
                    updateExperience(index, "startDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="month"
                  value={exp.endDate ?? ""}
                  onChange={(e) =>
                    updateExperience(
                      index,
                      "endDate",
                      e.target.value || null,
                    )
                  }
                  disabled={exp.isCurrent}
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent ?? false}
                    onChange={(e) =>
                      updateExperience(index, "isCurrent", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Current role
                  </span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  value={exp.description ?? ""}
                  onChange={(e) =>
                    updateExperience(index, "description", e.target.value)
                  }
                  placeholder="Describe your responsibilities and achievements..."
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Education
          </h3>
          <button
            type="button"
            onClick={addEducation}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + Add Education
          </button>
        </div>

        {(snapshot.education ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No education added yet.
          </p>
        )}

        {(snapshot.education ?? []).map((edu, index) => (
          <div
            key={`edu-${index.toString()}`}
            className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Education #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Institution *</label>
                <input
                  type="text"
                  value={edu.university}
                  onChange={(e) =>
                    updateEducation(index, "university", e.target.value)
                  }
                  placeholder="MIT"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Degree *</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducation(index, "degree", e.target.value)
                  }
                  placeholder="Bachelor of Science"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Field of Study</label>
                <input
                  type="text"
                  value={edu.fieldOfStudy ?? ""}
                  onChange={(e) =>
                    updateEducation(index, "fieldOfStudy", e.target.value)
                  }
                  placeholder="Computer Science"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Date *</label>
                <input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) =>
                    updateEducation(index, "startDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="month"
                  value={edu.endDate ?? ""}
                  onChange={(e) =>
                    updateEducation(index, "endDate", e.target.value || null)
                  }
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  value={edu.description ?? ""}
                  onChange={(e) =>
                    updateEducation(index, "description", e.target.value)
                  }
                  placeholder="Relevant coursework, achievements..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Skills
          </h3>
          <button
            type="button"
            onClick={addSkill}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + Add Skill
          </button>
        </div>

        {(
          (snapshot.skills as Array<{ name: string; category?: string }>) ?? []
        ).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No skills added yet.
          </p>
        )}

        {(
          (snapshot.skills as Array<{ name: string; category?: string }>) ?? []
        ).map((skill, index) => (
          <div
            key={`skill-${index.toString()}`}
            className="mb-2 flex items-center gap-2"
          >
            <input
              type="text"
              value={skill.name}
              onChange={(e) => updateSkill(index, "name", e.target.value)}
              placeholder="Skill name"
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="text"
              value={skill.category ?? ""}
              onChange={(e) => updateSkill(index, "category", e.target.value)}
              placeholder="Category"
              className={`w-40 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Projects
          </h3>
          <button
            type="button"
            onClick={addProject}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + Add Project
          </button>
        </div>

        {(snapshot.projects ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No projects added yet.
          </p>
        )}

        {(snapshot.projects ?? []).map((project, index) => (
          <div
            key={`proj-${index.toString()}`}
            className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Project #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Project Name *</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) =>
                    updateProject(index, "title", e.target.value)
                  }
                  placeholder="My Awesome Project"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Project URL</label>
                <input
                  type="url"
                  value={project.url ?? ""}
                  onChange={(e) =>
                    updateProject(index, "url", e.target.value)
                  }
                  placeholder="https://github.com/user/project"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  value={project.description ?? ""}
                  onChange={(e) =>
                    updateProject(index, "description", e.target.value)
                  }
                  placeholder="What does this project do?"
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Technologies</label>
                <input
                  type="text"
                  value={(project.technologies ?? []).join(", ")}
                  onChange={(e) =>
                    updateProject(
                      index,
                      "technologies",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="React, TypeScript, Node.js"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Certifications
          </h3>
          <button
            type="button"
            onClick={addCertificate}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + Add Certification
          </button>
        </div>

        {(snapshot.certificates ?? []).length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No certifications added yet.
          </p>
        )}

        {(snapshot.certificates ?? []).map((cert, index) => (
          <div
            key={`cert-${index.toString()}`}
            className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Certification #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeCertificate(index)}
                className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Certification Name *</label>
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) =>
                    updateCertificate(index, "name", e.target.value)
                  }
                  placeholder="AWS Solutions Architect"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Issuing Organisation</label>
                <input
                  type="text"
                  value={cert.issuingOrganisation ?? ""}
                  onChange={(e) =>
                    updateCertificate(
                      index,
                      "issuingOrganisation",
                      e.target.value,
                    )
                  }
                  placeholder="Amazon Web Services"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Issue Date *</label>
                <input
                  type="month"
                  value={cert.startDate}
                  onChange={(e) =>
                    updateCertificate(index, "startDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Expiry Date</label>
                <input
                  type="month"
                  value={cert.endDate ?? ""}
                  onChange={(e) =>
                    updateCertificate(
                      index,
                      "endDate",
                      e.target.value || null,
                    )
                  }
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Credential URL</label>
                <input
                  type="url"
                  value={cert.url ?? ""}
                  onChange={(e) =>
                    updateCertificate(index, "url", e.target.value)
                  }
                  placeholder="https://www.credential.net/..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSaving ? "Saving..." : "Save Resume"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <Link
          href={`/resumes/${resumeId}/preview`}
          className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Preview
        </Link>
      </div>
    </div>
  );
}
