"use client";

import { Sparkles, ArrowLeft, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/preview/resume-preview";
import type { ResumeSnapshot } from "@/types/resume";

// ─────────────────────────────────────────────────────────────
// AI Generation Preview
// ─────────────────────────────────────────────────────────────
// Displays the AI-generated resume snapshot for review.
// Shows an "AI Generated" banner and action buttons for
// accepting, regenerating, or returning to edit inputs.
// ─────────────────────────────────────────────────────────────

interface GenerateResumePreviewProps {
  snapshot: ResumeSnapshot;
  onAccept: () => void;
  onRegenerate: () => void;
  onEditInputs: () => void;
  loading: boolean;
  acceptLabel?: string;
}

export function GenerateResumePreview({
  snapshot,
  onAccept,
  onRegenerate,
  onEditInputs,
  loading,
  acceptLabel = "Use This Draft",
}: GenerateResumePreviewProps) {
  return (
    <div className="flex flex-col">
      {/* AI Generated banner */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-medium text-violet-700">
          AI-Generated Draft — review and edit after applying
        </p>
      </div>

      {/* Preview */}
      <div className="mb-4 max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        <ResumePreview snapshot={snapshot} />
      </div>

      {/* Section summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {snapshot.summary && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Summary
          </span>
        )}
        {snapshot.experiences && snapshot.experiences.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {snapshot.experiences.length} Experience{snapshot.experiences.length !== 1 ? "s" : ""}
          </span>
        )}
        {snapshot.education && snapshot.education.length > 0 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {snapshot.education.length} Education
          </span>
        )}
        {snapshot.skills && snapshot.skills.length > 0 && (
          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            {snapshot.skills.length} Skills
          </span>
        )}
        {snapshot.projects && snapshot.projects.length > 0 && (
          <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
            {snapshot.projects.length} Project{snapshot.projects.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="ghost"
          size="md"
          onClick={onEditInputs}
          disabled={loading}
          className="sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit Inputs
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onRegenerate}
          disabled={loading}
          className="sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Regenerate
        </Button>
        <Button
          variant="gradient"
          size="md"
          onClick={onAccept}
          disabled={loading}
          className="sm:flex-1"
        >
          <Check className="h-4 w-4" />
          {acceptLabel}
        </Button>
      </div>
    </div>
  );
}
