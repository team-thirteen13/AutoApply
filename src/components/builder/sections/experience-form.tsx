"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Sparkles,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/types/resume";
import { toMonthInputValue, fromMonthInputValue } from "@/lib/date-normalize";

type Experience = NonNullable<ResumeSnapshot["experiences"]>[number];

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  onAiImprove: (exp: {
    company: string;
    title: string;
    accomplishments: string[];
    skills: string[];
  }) => Promise<{ accomplishments: string[]; skills: string[] }>;
  errors?: Record<string, string>;
}

const employmentTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

export function ExperienceForm({
  data,
  onChange,
  onAiImprove,
  errors,
}: ExperienceFormProps) {
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);
  const [improvedExp, setImprovedExp] = useState<{
    idx: number;
    accomplishments: string[];
  } | null>(null);

  const addEntry = () => {
    onChange([
      ...data,
      {
        id: crypto.randomUUID(),
        company: "",
        title: "",
        employmentType: "",
        location: "",
        startDate: "",
        endDate: null,
        isCurrent: false,
        description: "",
        accomplishments: [],
        skills: [],
      },
    ]);
  };

  const removeEntry = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: string, value: unknown) => {
    const updated = [...data];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const moveEntry = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= data.length) return;
    const updated = [...data];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  const duplicateEntry = (idx: number) => {
    const clone = { ...data[idx], id: crypto.randomUUID() };
    const updated = [...data];
    updated.splice(idx + 1, 0, clone);
    onChange(updated);
  };

  const handleAiImprove = async (idx: number) => {
    const exp = data[idx];
    setImprovingIdx(idx);
    try {
      const result = await onAiImprove({
        company: exp.company,
        title: exp.title,
        accomplishments: exp.accomplishments ?? [],
        skills: exp.skills ?? [],
      });
      setImprovedExp({ idx, accomplishments: result.accomplishments });
    } catch {
      // Silently fail
    } finally {
      setImprovingIdx(null);
    }
  };

  const acceptImprovement = () => {
    if (improvedExp) {
      updateEntry(improvedExp.idx, "accomplishments", improvedExp.accomplishments);
      setImprovedExp(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Work Experience
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add your work history, starting with the most recent.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addEntry}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">
            No work experience added yet.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={addEntry}
            className="mt-3"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>
      )}

      {data.map((exp, idx) => (
        <div
          key={exp.id ?? idx}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label={`Experience entry ${idx + 1}: ${exp.title || "New"}`}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {exp.title || "New Experience"}
                {exp.company && ` at ${exp.company}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveEntry(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveEntry(idx, 1)}
                disabled={idx === data.length - 1}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => duplicateEntry(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeEntry(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Job Title" required>
              <Input
                value={exp.title}
                onChange={(e) => updateEntry(idx, "title", e.target.value)}
                placeholder="Software Engineer"
              />
            </FormField>

            <FormField label="Company" required>
              <Input
                value={exp.company}
                onChange={(e) => updateEntry(idx, "company", e.target.value)}
                placeholder="Acme Inc."
              />
            </FormField>

            <FormField label="Employment Type">
              <Select
                value={exp.employmentType ?? ""}
                onChange={(e) =>
                  updateEntry(idx, "employmentType", e.target.value)
                }
                options={employmentTypes}
                placeholder="Select type"
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={exp.location ?? ""}
                onChange={(e) => updateEntry(idx, "location", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </FormField>

            <FormField label="Start Date" required>
              <Input
                type="month"
                value={toMonthInputValue(exp.startDate)}
                onChange={(e) => updateEntry(idx, "startDate", fromMonthInputValue(e.target.value))}
              />
            </FormField>

            <FormField label="End Date">
              <Input
                type="month"
                value={toMonthInputValue(exp.endDate)}
                onChange={(e) =>
                  updateEntry(idx, "endDate", fromMonthInputValue(e.target.value))
                }
                disabled={exp.isCurrent}
              />
            </FormField>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exp.isCurrent ?? false}
                  onChange={(e) =>
                    updateEntry(idx, "isCurrent", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I currently work here
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <Textarea
                  value={exp.description ?? ""}
                  onChange={(e) =>
                    updateEntry(idx, "description", e.target.value)
                  }
                  placeholder="Describe your role and responsibilities..."
                  rows={3}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Achievement Bullet Points"
                hint="One per line"
              >
                <Textarea
                  value={(exp.accomplishments ?? []).join("\n")}
                  onChange={(e) =>
                    updateEntry(
                      idx,
                      "accomplishments",
                      e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Increased revenue by 25% through feature optimization&#10;Led a team of 5 engineers on a critical project&#10;Reduced load time by 40% using lazy loading"
                  rows={4}
                />
              </FormField>
            </div>
          </div>

          {/* AI Improve */}
          <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-violet-600">
                AI can help improve your achievement descriptions
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAiImprove(idx)}
                disabled={improvingIdx === idx}
                className="text-violet-700 hover:bg-violet-100"
              >
                {improvingIdx === idx ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI Improve
              </Button>
            </div>

            {improvedExp?.idx === idx && (
              <div className="mt-3 rounded-lg border border-violet-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-violet-700">
                  Improved achievements:
                </p>
                <ul className="space-y-1">
                  {improvedExp.accomplishments.map((acc, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-700"
                    >
                      • {acc}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={acceptImprovement}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setImprovedExp(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Validation errors */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
          {Object.entries(errors).map(([key, msg]) => (
            <p key={key} className="text-sm text-red-600">{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
