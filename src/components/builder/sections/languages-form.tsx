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
  errors?: Record<string, string>;
}

const proficiencyLevels = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "professional", label: "Professional" },
  { value: "intermediate", label: "Intermediate" },
  { value: "basic", label: "Basic" },
];

export function LanguagesForm({ data, onChange, errors }: LanguagesFormProps) {
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
              className="grid grid-cols-[1fr_44px] items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:grid-cols-[minmax(0,2fr)_minmax(150px,0.7fr)_44px]"
            >
              <label htmlFor={`lang-name-${idx}`} className="sr-only">
                Language name
              </label>
              <Input
                id={`lang-name-${idx}`}
                value={lang.name}
                onChange={(e) => updateLanguage(idx, "name", e.target.value)}
                placeholder="e.g. English"
                aria-label="Language name"
                className="col-span-2 w-full md:col-span-1"
              />
              <label htmlFor={`lang-proficiency-${idx}`} className="sr-only">
                Language proficiency level
              </label>
              <Select
                id={`lang-proficiency-${idx}`}
                value={lang.proficiency ?? "professional"}
                onChange={(e) =>
                  updateLanguage(idx, "proficiency", e.target.value)
                }
                options={proficiencyLevels}
                aria-label="Language proficiency level"
                className="w-full"
              />
              <button
                onClick={() => removeLanguage(idx)}
                className="flex h-11 w-11 items-center justify-center rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${lang.name || "language"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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
