"use client";

import { Clock, RotateCcw, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeVersion } from "@/types/resume";

interface VersionHistoryItemProps {
  version: ResumeVersion;
  isLatest: boolean;
  isSelected: boolean;
  onPreview: (version: ResumeVersion) => void;
  onRestore: (version: ResumeVersion) => void;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionHistoryItem({
  version,
  isLatest,
  isSelected,
  onPreview,
  onRestore,
}: VersionHistoryItemProps) {
  return (
    <li
      className={`rounded-xl border p-4 transition-colors ${
        isSelected
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900">
              {version.label || "Saved version"}
            </p>
            {isLatest && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" />
                Latest
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <time dateTime={version.createdAt}>
              {formatTimestamp(version.createdAt)}
            </time>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPreview(version)}
            aria-label={`Preview version from ${formatTimestamp(version.createdAt)}`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          {!isLatest && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRestore(version)}
              aria-label={`Restore version from ${formatTimestamp(version.createdAt)}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restore</span>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
