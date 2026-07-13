"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import type { GenerateResumeInput } from "@/lib/ai/types";

// ─────────────────────────────────────────────────────────────
// AI Generation Input Form
// ─────────────────────────────────────────────────────────────
// Collects structured career information for AI resume generation.
// All fields are optional except target role and background.
// Client-side validation prevents invalid submissions.
// ─────────────────────────────────────────────────────────────

export interface GenerateFormValues {
  targetRole: string;
  background: string;
  skills: string;
  education: string;
  experience: string;
  jobDescription: string;
  tone: string;
  title: string;
}

interface GenerateResumeFormProps {
  onSubmit: (input: GenerateResumeInput) => void;
  loading: boolean;
  error: string | null;
  initialTargetRole?: string;
  showTitleField?: boolean;
}

const TONE_OPTIONS = [
  { value: "", label: "Select a tone (optional)" },
  { value: "professional", label: "Professional" },
  { value: "modern", label: "Modern" },
  { value: "creative", label: "Creative" },
  { value: "concise", label: "Concise" },
];

export function GenerateResumeForm({
  onSubmit,
  loading,
  error,
  initialTargetRole = "",
  showTitleField = false,
}: GenerateResumeFormProps) {
  const [values, setValues] = useState<GenerateFormValues>({
    targetRole: initialTargetRole,
    background: "",
    skills: "",
    education: "",
    experience: "",
    jobDescription: "",
    tone: "",
    title: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    targetRole?: string;
    background?: string;
    title?: string;
  }>({});

  const handleChange = (
    field: keyof GenerateFormValues,
    value: string,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!values.targetRole.trim()) {
      errors.targetRole = "Target role is required";
    } else if (values.targetRole.trim().length > 200) {
      errors.targetRole = "Target role must be 200 characters or less";
    }

    if (!values.background.trim()) {
      errors.background = "Professional background is required";
    } else if (values.background.trim().length > 5000) {
      errors.background = "Background must be 5000 characters or less";
    }

    if (showTitleField && values.title.trim().length > 200) {
      errors.title = "Title must be 200 characters or less";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;

    // Build GenerateResumeInput from form values
    const input: GenerateResumeInput = {
      targetRole: values.targetRole.trim() || undefined,
      profile: {
        bio: values.background.trim() || undefined,
      },
    };

    // Parse comma-separated skills
    if (values.skills.trim()) {
      input.skills = values.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse experience notes into a single experience entry
    if (values.experience.trim()) {
      input.experiences = [
        {
          company: "Experience",
          title: values.targetRole.trim() || "Professional",
          startDate: "2020-01-01",
          description: values.experience.trim(),
        },
      ];
    }

    // Parse education notes into a single education entry
    if (values.education.trim()) {
      input.education = [
        {
          university: "Education",
          degree: "Degree",
          startDate: "2020-01-01",
          description: values.education.trim(),
        },
      ];
    }

    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Form-level error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Resume title (optional, for new resume flow) */}
      {showTitleField && (
        <FormField
          label="Resume Title"
          htmlFor="ai-resume-title"
          error={fieldErrors.title}
          hint="Optional — defaults to your target role"
        >
          <Input
            id="ai-resume-title"
            placeholder="e.g. Senior Software Engineer Resume"
            value={values.title}
            onChange={(e) => handleChange("title", e.target.value)}
            disabled={loading}
            error={!!fieldErrors.title}
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? "ai-resume-title-error" : undefined}
          />
        </FormField>
      )}

      {/* Target role (required) */}
      <FormField
        label="Target Role"
        htmlFor="ai-target-role"
        required
        error={fieldErrors.targetRole}
        hint="The job title or position you're targeting"
      >
        <Input
          id="ai-target-role"
          placeholder="e.g. Senior Software Engineer"
          value={values.targetRole}
          onChange={(e) => handleChange("targetRole", e.target.value)}
          disabled={loading}
          error={!!fieldErrors.targetRole}
          aria-invalid={!!fieldErrors.targetRole}
          aria-describedby={fieldErrors.targetRole ? "ai-target-role-error" : undefined}
        />
      </FormField>

      {/* Professional background (required) */}
      <FormField
        label="Professional Background"
        htmlFor="ai-background"
        required
        error={fieldErrors.background}
        hint="Describe your experience, key achievements, and career highlights"
      >
        <Textarea
          id="ai-background"
          placeholder="e.g. 5+ years of experience building web applications with React and Node.js. Led a team of 4 engineers to deliver a real-time collaboration platform serving 10k+ users..."
          value={values.background}
          onChange={(e) => handleChange("background", e.target.value)}
          disabled={loading}
          rows={4}
          error={!!fieldErrors.background}
          aria-invalid={!!fieldErrors.background}
          aria-describedby={fieldErrors.background ? "ai-background-error" : undefined}
        />
      </FormField>

      {/* Skills (optional) */}
      <FormField
        label="Skills"
        htmlFor="ai-skills"
        hint="Comma-separated list of relevant skills"
      >
        <Input
          id="ai-skills"
          placeholder="e.g. React, TypeScript, Node.js, PostgreSQL, AWS"
          value={values.skills}
          onChange={(e) => handleChange("skills", e.target.value)}
          disabled={loading}
        />
      </FormField>

      {/* Education (optional) */}
      <FormField
        label="Education"
        htmlFor="ai-education"
        hint="Degree, institution, and any notable details"
      >
        <Textarea
          id="ai-education"
          placeholder="e.g. B.S. Computer Science, MIT, 2018. GPA 3.8, Dean's List, relevant coursework in algorithms and distributed systems."
          value={values.education}
          onChange={(e) => handleChange("education", e.target.value)}
          disabled={loading}
          rows={2}
        />
      </FormField>

      {/* Experience notes (optional) */}
      <FormField
        label="Experience Notes"
        htmlFor="ai-experience"
        hint="Key roles, responsibilities, and accomplishments"
      >
        <Textarea
          id="ai-experience"
          placeholder="e.g. Software Engineer at Acme Corp (2020-present): Led migration from monolith to microservices, reducing deploy times by 60%. Built real-time notification system handling 1M+ events/day."
          value={values.experience}
          onChange={(e) => handleChange("experience", e.target.value)}
          disabled={loading}
          rows={3}
        />
      </FormField>

      {/* Job description (optional) */}
      <FormField
        label="Job Description"
        htmlFor="ai-job-description"
        hint="Paste the target job description for a tailored resume"
      >
        <Textarea
          id="ai-job-description"
          placeholder="Paste the job description here..."
          value={values.jobDescription}
          onChange={(e) => handleChange("jobDescription", e.target.value)}
          disabled={loading}
          rows={3}
        />
      </FormField>

      {/* Tone (optional) */}
      <FormField
        label="Preferred Tone"
        htmlFor="ai-tone"
        hint="Controls the writing style of generated content"
      >
        <Select
          id="ai-tone"
          options={TONE_OPTIONS}
          value={values.tone}
          onChange={(e) => handleChange("tone", e.target.value)}
          disabled={loading}
        />
      </FormField>

      {/* Submit */}
      <Button
        type="submit"
        variant="gradient"
        size="lg"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Resume...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Resume
          </>
        )}
      </Button>
    </form>
  );
}
