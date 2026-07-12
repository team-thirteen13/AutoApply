"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/types/resume";

type Language = NonNullable<ResumeSnapshot["languages"]>[number];

interface LanguagesFormProps {
  data: Language[];
  onChange: (data: Language[]) => void;
}

const proficiencyLevels = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "professional", label: "Professional" },
  { value: "intermediate", label: "Intermediate" },
  { value: "basic", label: "Basic" },
];

export function LanguagesForm({ data, onChange }: LanguagesFormProps) {
  const addLanguage = () => {
    onChange([
      ...data,
      { id: crypto.randomUUID(), name: "", proficiency: "professional" },
    ]);
  };

  const removeLanguage = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  const updateLanguage = (idx: number, field: string, value: string) => {
    const updated = [...data];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Languages</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add languages you speak and your proficiency level.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addLanguage}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">No languages added yet.</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={addLanguage}
            className="mt-3"
          >
            <Plus className="h-4 w-4" />
            Add Language
          </Button>
        </div>
      )}

      {data.length > 0 && (
        <div className="space-y-3">
          {data.map((lang, idx) => (
            <div
              key={lang.id ?? idx}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <Input
                value={lang.name}
                onChange={(e) => updateLanguage(idx, "name", e.target.value)}
                placeholder="Language"
                className="flex-1"
              />
              <Select
                value={lang.proficiency ?? "professional"}
                onChange={(e) =>
                  updateLanguage(idx, "proficiency", e.target.value)
                }
                options={proficiencyLevels}
                className="w-40"
              />
              <button
                onClick={() => removeLanguage(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${lang.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
