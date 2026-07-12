"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { SECTIONS } from "./builder-sidebar";

interface MobileSectionNavProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  completedSections: Set<string>;
}

export function MobileSectionNav({
  activeSection,
  onSectionClick,
  completedSections,
}: MobileSectionNavProps) {
  const [open, setOpen] = useState(false);

  const active = SECTIONS.find((s) => s.id === activeSection);
  const Icon = active?.icon;

  return (
    <div className="mb-4 lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          {active?.label ?? "Select Section"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isCompleted = completedSections.has(section.id);
            const SIcon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionClick(section.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <SIcon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-emerald-500"
                        : "text-slate-400"
                  }`}
                />
                <span className="flex-1">{section.label}</span>
                {isCompleted && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
