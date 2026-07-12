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

type Education = NonNullable<ResumeSnapshot["education"]>[number];

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const addEntry = () => {
    onChange([
      ...data,
      {
        id: crypto.randomUUID(),
        university: "",
        degree: "",
        fieldOfStudy: "",
        location: "",
        startDate: "",
        endDate: null,
        isCurrent: false,
        grade: "",
        description: "",
        achievements: [],
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
          <h2 className="text-xl font-bold text-slate-900">Education</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add your educational background.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addEntry}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">No education added yet.</p>
          <Button size="sm" variant="ghost" onClick={addEntry} className="mt-3">
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </div>
      )}

      {data.map((edu, idx) => (
        <div
          key={edu.id ?? idx}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {edu.degree || "New Education"}
                {edu.university && ` — ${edu.university}`}
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
            <FormField label="Institution" required>
              <Input
                value={edu.university}
                onChange={(e) =>
                  updateEntry(idx, "university", e.target.value)
                }
                placeholder="MIT"
              />
            </FormField>

            <FormField label="Degree" required>
              <Input
                value={edu.degree}
                onChange={(e) => updateEntry(idx, "degree", e.target.value)}
                placeholder="Bachelor of Science"
              />
            </FormField>

            <FormField label="Field of Study">
              <Input
                value={edu.fieldOfStudy ?? ""}
                onChange={(e) =>
                  updateEntry(idx, "fieldOfStudy", e.target.value)
                }
                placeholder="Computer Science"
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={edu.location ?? ""}
                onChange={(e) => updateEntry(idx, "location", e.target.value)}
                placeholder="Cambridge, MA"
              />
            </FormField>

            <FormField label="Start Date" required>
              <Input
                type="month"
                value={edu.startDate}
                onChange={(e) =>
                  updateEntry(idx, "startDate", e.target.value)
                }
              />
            </FormField>

            <FormField label="End Date">
              <Input
                type="month"
                value={edu.endDate ?? ""}
                onChange={(e) =>
                  updateEntry(idx, "endDate", e.target.value || null)
                }
                disabled={edu.isCurrent}
              />
            </FormField>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={edu.isCurrent ?? false}
                  onChange={(e) =>
                    updateEntry(idx, "isCurrent", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Currently studying here
                </span>
              </label>
            </div>

            <FormField label="Grade / GPA" hint="Optional">
              <Input
                value={edu.grade ?? ""}
                onChange={(e) => updateEntry(idx, "grade", e.target.value)}
                placeholder="3.8 / 4.0"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description" hint="Optional">
                <Textarea
                  value={edu.description ?? ""}
                  onChange={(e) =>
                    updateEntry(idx, "description", e.target.value)
                  }
                  placeholder="Relevant coursework, activities..."
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
