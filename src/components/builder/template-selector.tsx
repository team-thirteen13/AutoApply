"use client";

import type { ResumeTemplateId } from "@/lib/templates/types";
import { TEMPLATES } from "@/lib/templates/registry";

interface TemplateSelectorProps {
  selected: ResumeTemplateId;
  onChange: (id: ResumeTemplateId) => void;
}

/**
 * Template selector using native radio-group semantics.
 * Accessible: fieldset/legend, radio inputs, associated labels,
 * keyboard navigable, visible focus states.
 */
export function TemplateSelector({ selected, onChange }: TemplateSelectorProps) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-slate-900">
        Resume Template
      </legend>
      <p className="mb-3 text-xs text-slate-500">
        Choose a visual style for your resume
      </p>
      <div
        className="grid grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Resume template selection"
      >
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.id;
          return (
            <label
              key={template.id}
              className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={isSelected}
                onChange={() => onChange(template.id)}
                className="sr-only"
                aria-label={`${template.name} template: ${template.description}`}
              />
              {/* Thumbnail preview */}
              <div
                className="mb-2 h-16 w-full rounded border"
                style={template.thumbnailStyle}
                aria-hidden="true"
              >
                {/* Mini layout preview */}
                <div className="p-1.5">
                  <div className="mb-1 h-1 w-8 rounded bg-slate-400" />
                  <div className="mb-1 h-0.5 w-12 rounded bg-slate-300" />
                  <div className="mb-1 h-0.5 w-10 rounded bg-slate-300" />
                  <div className="mb-1 h-0.5 w-6 rounded bg-slate-300" />
                  <div className="mt-1.5 h-0.5 w-14 rounded bg-slate-200" />
                  <div className="h-0.5 w-12 rounded bg-slate-200" />
                </div>
              </div>
              {/* Template name */}
              <p
                className={`text-xs font-medium ${
                  isSelected ? "text-blue-700" : "text-slate-700"
                }`}
              >
                {template.name}
              </p>
              <p className="text-[10px] text-slate-500">
                {template.description}
              </p>
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <svg
                    className="h-4 w-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
