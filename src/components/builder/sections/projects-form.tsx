"use client";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/types/resume";
import { toMonthInputValue, fromMonthInputValue } from "@/lib/date-normalize";

type Project = NonNullable<ResumeSnapshot["projects"]>[number];

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
  errors?: Record<string, string>;
}

export function ProjectsForm({ data, onChange, errors }: ProjectsFormProps) {
  const addEntry = () => {
    onChange([
      ...data,
      {
        id: crypto.randomUUID(),
        title: "",
        role: "",
        description: "",
        technologies: [],
        url: "",
        liveUrl: "",
        gitUrl: "",
        startDate: "",
        endDate: null,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          <p className="mt-1 text-sm text-slate-500">
            Showcase your best projects.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addEntry}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">No projects added yet.</p>
          <Button size="sm" variant="ghost" onClick={addEntry} className="mt-3">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      )}

      {data.map((proj, idx) => (
        <div
          key={proj.id ?? idx}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {proj.title || "New Project"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveEntry(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveEntry(idx, 1)}
                disabled={idx === data.length - 1}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => duplicateEntry(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
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
            <FormField label="Project Name" required>
              <Input
                value={proj.title}
                onChange={(e) => updateEntry(idx, "title", e.target.value)}
                placeholder="My Awesome Project"
              />
            </FormField>

            <FormField label="Role">
              <Input
                value={proj.role ?? ""}
                onChange={(e) => updateEntry(idx, "role", e.target.value)}
                placeholder="Lead Developer"
              />
            </FormField>

            <FormField label="Project URL">
              <Input
                type="url"
                value={proj.url ?? ""}
                onChange={(e) => updateEntry(idx, "url", e.target.value)}
                placeholder="https://project.example.com"
              />
            </FormField>

            <FormField label="GitHub URL">
              <Input
                type="url"
                value={proj.gitUrl ?? ""}
                onChange={(e) => updateEntry(idx, "gitUrl", e.target.value)}
                placeholder="https://github.com/user/project"
              />
            </FormField>

            <FormField label="Start Date">
              <Input
                type="month"
                value={toMonthInputValue(proj.startDate)}
                onChange={(e) =>
                  updateEntry(idx, "startDate", fromMonthInputValue(e.target.value))
                }
              />
            </FormField>

            <FormField label="End Date">
              <Input
                type="month"
                value={toMonthInputValue(proj.endDate)}
                onChange={(e) =>
                  updateEntry(idx, "endDate", fromMonthInputValue(e.target.value))
                }
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <Textarea
                  value={proj.description ?? ""}
                  onChange={(e) =>
                    updateEntry(idx, "description", e.target.value)
                  }
                  placeholder="What does this project do?"
                  rows={2}
                />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Technologies"
                hint="Comma-separated"
              >
                <Input
                  value={(proj.technologies ?? []).join(", ")}
                  onChange={(e) =>
                    updateEntry(
                      idx,
                      "technologies",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="React, TypeScript, Node.js"
                />
              </FormField>
            </div>
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
