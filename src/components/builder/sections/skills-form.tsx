"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/types/resume";

type Skill = NonNullable<ResumeSnapshot["skills"]>[number];

interface SkillsFormProps {
  data: ResumeSnapshot["skills"];
  onChange: (data: ResumeSnapshot["skills"]) => void;
  errors?: Record<string, string>;
}

const categories = [
  { value: "technical", label: "Technical" },
  { value: "tools", label: "Tools" },
  { value: "soft-skills", label: "Soft Skills" },
  { value: "languages", label: "Languages" },
  { value: "other", label: "Other" },
];

const proficiencyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const suggestions = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "SQL",
  "Supabase",
  "Git",
  "Docker",
  "Communication",
  "Problem Solving",
  "Team Leadership",
];

export function SkillsForm({ data, onChange, errors }: SkillsFormProps) {
  const [newSkill, setNewSkill] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newProficiency, setNewProficiency] = useState("");

  // Data is now always in object form (normalized at load boundary)
  const skills: Skill[] = Array.isArray(data) ? data : [];

  const addSkill = (name: string, category?: string, proficiency?: string) => {
    if (!name.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...skills, { name: name.trim(), category: category ?? "", proficiency: proficiency ?? "" }]);
    setNewSkill("");
  };

  const removeSkill = (idx: number) => {
    onChange(skills.filter((_, i) => i !== idx));
  };

  const handleAddNew = () => {
    addSkill(newSkill, newCategory, newProficiency);
    setNewCategory("");
    setNewProficiency("");
  };

  const availableSuggestions = suggestions.filter(
    (s) => !skills.some((sk) => sk.name.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Skills</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add your key skills and competencies.
        </p>
      </div>

      {/* Quick add suggestions */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          Quick add:
        </p>
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => addSkill(s)}
              aria-label={`Add ${s} skill`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Add new skill */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Skill name"
            className="sm:col-span-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNew();
              }
            }}
          />
          <Select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            options={categories}
            placeholder="Category"
          />
          <div className="flex gap-2">
            <Select
              value={newProficiency}
              onChange={(e) => setNewProficiency(e.target.value)}
              options={proficiencyLevels}
              placeholder="Level"
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddNew}
              disabled={!newSkill.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Skill list */}
      {skills.length > 0 && (
        <div className="space-y-2">
          {skills.map((skill, idx) => (
            <div
              key={skill.name + idx.toString()}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <GripVertical className="h-4 w-4 text-slate-300" />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {skill.name}
              </span>
              {skill.category && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {skill.category}
                </span>
              )}
              {skill.proficiency && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  {skill.proficiency}
                </span>
              )}
              <button
                onClick={() => removeSkill(idx)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${skill.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <p className="text-sm text-slate-400">No skills added yet.</p>
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
